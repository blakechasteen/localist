"""
Thompson Sampling Recommendations

Personalized business recommendations using Multi-Armed Bandit algorithm
"""

from typing import List, Dict, Optional
import numpy as np
from dataclasses import dataclass
from datetime import datetime, timedelta
import json


@dataclass
class BusinessArm:
    """Represents a business in the multi-armed bandit."""
    business_id: int
    successes: int = 0  # Number of positive interactions
    failures: int = 0   # Number of negative interactions
    last_updated: datetime = None

    def __post_init__(self):
        if self.last_updated is None:
            self.last_updated = datetime.utcnow()

    @property
    def total_pulls(self) -> int:
        """Total number of times this arm has been pulled."""
        return self.successes + self.failures

    @property
    def success_rate(self) -> float:
        """Empirical success rate."""
        if self.total_pulls == 0:
            return 0.5  # Prior belief
        return self.successes / self.total_pulls


class ThompsonSamplingRecommender:
    """
    Thompson Sampling recommender for personalized business suggestions.

    Uses Beta distribution to model uncertainty about each business's
    reward probability.
    """

    def __init__(self, user_id: int):
        self.user_id = user_id
        self.arms: Dict[int, BusinessArm] = {}  # business_id -> BusinessArm

    def add_business(self, business_id: int):
        """Add a new business to the bandit."""
        if business_id not in self.arms:
            self.arms[business_id] = BusinessArm(business_id=business_id)

    def sample_arm(self, business_id: int) -> float:
        """
        Sample from the Beta distribution for a business.

        Returns a value between 0 and 1 representing the sampled
        probability of success.
        """
        arm = self.arms.get(business_id)
        if arm is None:
            # New business - use uninformative prior
            return np.random.beta(1, 1)

        # Sample from Beta(successes + 1, failures + 1)
        # The +1 is the Beta prior (equivalent to one imaginary success and one failure)
        alpha = arm.successes + 1
        beta = arm.failures + 1

        return np.random.beta(alpha, beta)

    def recommend(
        self,
        candidate_businesses: List[int],
        n_recommendations: int = 5,
        epsilon: float = 0.1
    ) -> List[int]:
        """
        Recommend businesses using Thompson Sampling with epsilon-greedy exploration.

        Args:
            candidate_businesses: List of business IDs to choose from
            n_recommendations: Number of businesses to recommend
            epsilon: Probability of random exploration (0.1 = 10% random)

        Returns:
            List of recommended business IDs
        """
        # Add any new businesses
        for business_id in candidate_businesses:
            self.add_business(business_id)

        recommendations = []

        for _ in range(min(n_recommendations, len(candidate_businesses))):
            # Epsilon-greedy exploration
            if np.random.random() < epsilon:
                # Random exploration
                remaining = [b for b in candidate_businesses if b not in recommendations]
                if remaining:
                    recommendations.append(np.random.choice(remaining))
            else:
                # Thompson Sampling
                # Sample from each arm and choose the highest
                samples = {
                    business_id: self.sample_arm(business_id)
                    for business_id in candidate_businesses
                    if business_id not in recommendations
                }

                if samples:
                    best_business = max(samples.items(), key=lambda x: x[1])[0]
                    recommendations.append(best_business)

        return recommendations

    def update(self, business_id: int, reward: float):
        """
        Update the bandit based on user interaction.

        Args:
            business_id: The business that was interacted with
            reward: Reward value (0-1):
                - 0.1: Viewed
                - 0.3: Clicked
                - 0.5: Visited
                - 1.0: Purchased/Favorited
        """
        if business_id not in self.arms:
            self.add_business(business_id)

        arm = self.arms[business_id]

        # Convert reward to success/failure
        # Use threshold of 0.4 - anything above is a "success"
        if reward >= 0.4:
            arm.successes += 1
        else:
            arm.failures += 1

        arm.last_updated = datetime.utcnow()

    def get_stats(self) -> Dict:
        """Get statistics about the recommender."""
        return {
            "user_id": self.user_id,
            "total_businesses": len(self.arms),
            "total_interactions": sum(arm.total_pulls for arm in self.arms.values()),
            "top_businesses": [
                {
                    "business_id": arm.business_id,
                    "success_rate": arm.success_rate,
                    "total_pulls": arm.total_pulls,
                }
                for arm in sorted(
                    self.arms.values(),
                    key=lambda x: x.success_rate,
                    reverse=True
                )[:10]
            ],
        }

    def to_dict(self) -> Dict:
        """Serialize recommender to dict (for storage in database)."""
        return {
            "user_id": self.user_id,
            "arms": {
                business_id: {
                    "successes": arm.successes,
                    "failures": arm.failures,
                    "last_updated": arm.last_updated.isoformat(),
                }
                for business_id, arm in self.arms.items()
            },
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'ThompsonSamplingRecommender':
        """Deserialize recommender from dict."""
        recommender = cls(user_id=data["user_id"])

        for business_id, arm_data in data.get("arms", {}).items():
            recommender.arms[int(business_id)] = BusinessArm(
                business_id=int(business_id),
                successes=arm_data["successes"],
                failures=arm_data["failures"],
                last_updated=datetime.fromisoformat(arm_data["last_updated"]),
            )

        return recommender


# In-memory storage for development (replace with Redis in production)
user_recommenders: Dict[int, ThompsonSamplingRecommender] = {}


def get_recommender(user_id: int) -> ThompsonSamplingRecommender:
    """Get or create recommender for a user."""
    if user_id not in user_recommenders:
        user_recommenders[user_id] = ThompsonSamplingRecommender(user_id)

    return user_recommenders[user_id]


def save_recommender(recommender: ThompsonSamplingRecommender):
    """
    Save recommender to persistent storage.

    In production, this should save to:
    - PostgreSQL (user_preferences table)
    - Redis (for fast access)
    """
    # For development, just keep in memory
    user_recommenders[recommender.user_id] = recommender

    # TODO: Save to database
    # serialized = json.dumps(recommender.to_dict())
    # db.execute("UPDATE users SET recommender_state = %s WHERE id = %s",
    #            (serialized, recommender.user_id))


def load_recommender(user_id: int) -> Optional[ThompsonSamplingRecommender]:
    """
    Load recommender from persistent storage.

    In production, this should load from PostgreSQL/Redis.
    """
    # TODO: Load from database
    # result = db.query("SELECT recommender_state FROM users WHERE id = %s", (user_id,))
    # if result:
    #     return ThompsonSamplingRecommender.from_dict(json.loads(result['recommender_state']))

    return user_recommenders.get(user_id)


# Interaction rewards mapping
INTERACTION_REWARDS = {
    "viewed": 0.1,
    "clicked": 0.3,
    "messaged": 0.5,
    "visited": 0.7,
    "favorited": 1.0,
    "purchased": 1.0,
    "reviewed": 1.0,
}


def record_interaction(
    user_id: int,
    business_id: int,
    interaction_type: str
):
    """
    Record user interaction and update recommender.

    Args:
        user_id: User who interacted
        business_id: Business that was interacted with
        interaction_type: Type of interaction (viewed, clicked, visited, etc.)
    """
    reward = INTERACTION_REWARDS.get(interaction_type, 0.1)

    recommender = get_recommender(user_id)
    recommender.update(business_id, reward)
    save_recommender(recommender)
