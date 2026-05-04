import pandas as pd
import numpy as np
from typing import Optional, Tuple
from app.models.responses import TrendAnalysis, Anomaly


def analyze_dataset(
    df: pd.DataFrame,
    value_col: str,
    date_col: str,
    date_format: Optional[str] = None,
) -> Tuple[TrendAnalysis, list, dict]:
    df = df.copy()
    if date_format:
        parsed_dates = pd.to_datetime(df[date_col], format=date_format, errors="coerce")
    else:
        parsed_dates = pd.to_datetime(df[date_col], format="mixed", errors="coerce")
    
    if parsed_dates.isna().all() and len(df) > 0:
        df[date_col] = pd.date_range(end=pd.Timestamp.now(), periods=len(df)).normalize()
    else:
        df[date_col] = parsed_dates
        
    df = df.dropna(subset=[date_col, value_col])
    df = df.sort_values(date_col)
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df = df.dropna(subset=[value_col])
    df = df.replace([np.inf, -np.inf], np.nan).dropna(subset=[value_col])

    if len(df) == 0:
        raise ValueError("No valid data points found after cleaning dates and values.")

    values = df[value_col].values
    n = len(values)

    # Trend via linear regression slope
    x = np.arange(n)
    slope = float(np.polyfit(x, values, 1)[0]) if n > 1 else 0.0
    pct_change_total = float((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0.0

    if slope > 0 and pct_change_total > 1:
        direction = "bullish"
    elif slope < 0 and pct_change_total < -1:
        direction = "bearish"
    elif np.std(values) / np.mean(values) > 0.15 if np.mean(values) != 0 else False:
        direction = "volatile"
    else:
        direction = "neutral"

    # Period changes
    period_changes = {}
    if n >= 7:
        period_changes["wow"] = round(float((values[-1] - values[-7]) / values[-7] * 100), 2) if values[-7] != 0 else 0.0
    if n >= 30:
        period_changes["mom"] = round(float((values[-1] - values[-30]) / values[-30] * 100), 2) if values[-30] != 0 else 0.0

    # Moving averages
    ma = {}
    for w, key in [(7, "ma7"), (30, "ma30"), (90, "ma90")]:
        if n >= w:
            ma[key] = round(float(df[value_col].rolling(w).mean().iloc[-1]), 4)
        else:
            ma[key] = None

    # Volatility (annualized std of returns)
    returns = pd.Series(values).pct_change().dropna()
    volatility = float(returns.std() * np.sqrt(252)) if len(returns) > 1 else 0.0

    # Peak and trough
    peak_idx = int(np.argmax(values))
    trough_idx = int(np.argmin(values))
    peak = {"date": str(df[date_col].iloc[peak_idx].date()), "value": round(float(values[peak_idx]), 4)}
    trough = {"date": str(df[date_col].iloc[trough_idx].date()), "value": round(float(values[trough_idx]), 4)}

    # Anomalies via z-score
    rolling_mean = pd.Series(values).rolling(30, min_periods=5).mean()
    rolling_std = pd.Series(values).rolling(30, min_periods=5).std()
    z_scores = (pd.Series(values) - rolling_mean) / rolling_std.replace(0, np.nan)
    anomalies = []
    for i, z in enumerate(z_scores):
        if not np.isnan(z) and abs(z) > 2.0:
            anomalies.append(Anomaly(
                date=str(df[date_col].iloc[i].date()),
                value=round(float(values[i]), 4),
                z_score=round(float(z), 2)
            ))

    # Risk
    risk_factors = []
    if volatility > 0.4:
        risk_factors.append("High annualized volatility")
    if len(anomalies) > 3:
        risk_factors.append(f"{len(anomalies)} anomalous data points detected")
    if direction == "bearish" and abs(pct_change_total) > 10:
        risk_factors.append("Significant downward trend")
    if direction == "volatile":
        risk_factors.append("High price variability")

    if len(risk_factors) >= 3:
        risk_level = "critical"
    elif len(risk_factors) == 2:
        risk_level = "high"
    elif len(risk_factors) == 1:
        risk_level = "medium"
    else:
        risk_level = "low"

    trend = TrendAnalysis(
        direction=direction,
        slope=round(slope, 6),
        period_changes=period_changes,
        moving_averages=ma,
        volatility=round(volatility, 4),
        peak=peak,
        trough=trough,
        anomalies=anomalies,
        risk_level=risk_level,
        risk_factors=risk_factors
    )

    # Dataset summary
    summary = {
        "row_count": n,
        "date_range_start": str(df[date_col].iloc[0].date()),
        "date_range_end": str(df[date_col].iloc[-1].date()),
        "value_min": round(float(values.min()), 4),
        "value_max": round(float(values.max()), 4),
        "value_mean": round(float(values.mean()), 4),
        "value_median": round(float(np.median(values)), 4),
    }

    # Chart data
    anomaly_dates = {a.date for a in anomalies}
    chart_data = []
    for i, row in df.iterrows():
        point = {
            "date": str(row[date_col].date()),
            "value": round(float(row[value_col]), 4),
            "is_anomaly": str(row[date_col].date()) in anomaly_dates,
        }
        if ma["ma7"] is not None and i >= 6:
            point["ma7"] = round(float(df[value_col].iloc[:df.index.get_loc(i)+1].tail(7).mean()), 4)
        chart_data.append(point)

    return trend, chart_data, summary
