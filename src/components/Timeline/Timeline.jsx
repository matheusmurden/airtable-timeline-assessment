import React, { useState, useCallback } from "react";
import timelineItems from "../../timelineItems";
import { assignLanes } from "../../assignLanes";
import styles from "./styles.module.css";

export function Timeline() {
  const [items, setItems] = useState(timelineItems);
  const [scale, setScale] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const lanes = assignLanes(items);

  // Date range for the timeline as well as min and max dates
  const startDates = items.map((item) => new Date(item.start));
  const endDates = items.map((item) => new Date(item.end));
  const minDate = new Date(Math.min(...startDates));
  const maxDate = new Date(Math.max(...endDates));
  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24) + 1;

  const handleZoom = (direction) => {
    setScale((prev) => {
      const newScale = direction === "in" ? prev * 1.2 : prev / 1.2;
      return Math.min(Math.max(newScale, 0.5), 3);
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const saveEdit = () => {
    if (!editingId) return;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === editingId ? { ...item, name: editValue } : item,
      ),
    );
    setEditingId(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  // Date markers logic for rendering the timeline header
  const buildDateMarkers = useCallback(() => {
    const markers = [];
    const markerDate = new Date(minDate);
    const endDate = new Date(maxDate);

    while (markerDate <= endDate) {
      const isFirstOfMonth = markerDate.getDate() === 1;
      const isFirstDay = markerDate.getTime() === minDate.getTime();

      if (isFirstOfMonth || isFirstDay) {
        const dayDiff = Math.floor(
          (markerDate - minDate) / (1000 * 60 * 60 * 24),
        );
        const left = `${(dayDiff / totalDays) * 100}%`;

        markers.push(
          <div
            key={markerDate.getTime()}
            className={styles.dateMarker}
            style={{ left }}
          >
            <div className={styles.dateLabel}>
              {markerDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className={styles.dateLine} />
          </div>,
        );
      }
      markerDate.setDate(markerDate.getDate() + 1);
    }
    return markers;
  }, [minDate, maxDate, totalDays]);

  const isEditing = useCallback(
    (id) => {
      return editingId === id;
    },
    [editingId],
  );

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={() => handleZoom("out")}>-</button>
        <span>Zoom: {(scale * 100).toFixed(0)}%</span>
        <button onClick={() => handleZoom("in")}>+</button>
      </div>

      <div
        className={styles.timeline}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Render date headers */}
        <div className={styles.header}>{buildDateMarkers()}</div>

        {/* Render lanes */}
        {lanes.map((lane, laneIndex) => (
          <div key={laneIndex} className={styles.lane}>
            {lane.map((item) => {
              const startDate = new Date(item.start);
              const endDate = new Date(item.end);
              const startDay = Math.floor(
                (startDate - minDate) / (1000 * 60 * 60 * 24),
              );
              const durationDays =
                Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

              // Position item based on start date
              const left = `${(startDay / totalDays) * 100}%`;

              // Define item width based on item duration
              const width = `${(durationDays / totalDays) * 100}%`;

              return (
                <div
                  key={item.id}
                  className={styles.item}
                  style={{
                    left,
                    width,
                    minWidth: isEditing(item.id) ? "250px" : "50px",
                    zIndex: isEditing(item.id) ? 1 : 0,
                  }}
                  onClick={() => startEdit(item)}
                >
                  {isEditing(item.id) ? (
                    <input
                      className={styles.input}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleKeyPress}
                      autoFocus
                    />
                  ) : (
                    <span>{item.name}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
