import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteRestaurant,
  analyzeReviews,
} from "../redux/actions/restaurantAction";

const Restaurant = ({ restaurant }) => {
  const dispatch = useDispatch();
  const [showAI, setShowAI] = useState(false);

  const { isAuthenticated, user } = useSelector(
    (state) => state.user || {}
  );

  const { analyzingId } = useSelector(
    (state) => state.restaurants || {}
  );

  const hasSummary = Boolean(
    restaurant.reviewSentiment || restaurant.reviewSummaryBullets
  );

  const isAnalyzing = analyzingId === restaurant._id;

  const sentimentEmoji = (sentiment) => {
    if (sentiment === "positive") return "😊";
    if (sentiment === "negative") return "😞";
    if (sentiment === "mixed") return "😐";
    return "🤖";
  };

  const handleToggleAI = async () => {
    if (showAI) {
      setShowAI(false);
      return;
    }

    try {
      await dispatch(analyzeReviews(restaurant._id)).unwrap();
      setShowAI(true);
    } catch (errMsg) {
      alert(errMsg || "Unable to analyze reviews");
    }
  };

  //DELETE
  const handleDelete = () => {
    if (!window.confirm("Delete this restaurant?")) return;

    dispatch(deleteRestaurant(restaurant._id)).catch(() => {
      alert("Unable to delete");
    });
  };
  return (
    <div className="col-12 my-3">
    <div className="card restaurant-card p-3">

  <Link to={`/eats/stores/${restaurant._id}/menus`}>
    <img
      className="restaurant-image"
      src={restaurant.images?.[0]?.url}
      alt={restaurant.name}
    />
  </Link>

  <div className="restaurant-info">

    <h4>{restaurant.name}</h4>

    <p className="rest_address">
      {restaurant.address}
    </p>

    <div className="ratings">
      <div className="rating-outer">
        <div
          className="rating-inner"
          style={{
            width: `${(restaurant.ratings / 5) * 100}%`,
          }}
        ></div>
      </div>

      <span>
        ({restaurant.numOfReviews} Reviews)
      </span>
    </div>

    <button
      className="ai-btn"
      onClick={handleToggleAI}
      disabled={isAnalyzing}
    >
      {isAnalyzing
        ? "⏳ Analyzing..."
        : showAI
        ? "➖ Hide Summary"
        : "💬 View Review Summary"}
    </button>

  </div>

    {showAI && (
      <div className="ai-insights-box">

      {hasSummary ? (
        <>
        <div className="ai-status">
        Review Summary :
            <strong>
              {restaurant.reviewSentiment}
            </strong>
            {" "}{sentimentEmoji(restaurant.reviewSentiment)}
          </div>

          <ul>
            {(restaurant.reviewSummaryBullets || []).map(
              (point, index) => (
                <li key={index}>{point}</li>
              )
            )}
          </ul>

          <div className="mentions">
            {(restaurant.reviewTopMentions || []).map(
              (item, index) => (
                <span
                  key={index}
                  className="mention-tag"
                >
                  #{item}
                </span>
              )
            )}
          </div>
          </>
        ) : (
          <p className="mb-0">
            ⏳ Generating AI review summary...
          </p>
        )}

      </div>
    )}

</div>

 {isAuthenticated && user && user.role === "admin" && (
            <button
              className="btn btn-danger btn-sm mt-2"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
    </div>
  );
};

export default Restaurant;