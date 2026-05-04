import json
import structlog
from google import genai
from app.config import settings
from app.models.responses import TrendAnalysis, StructuredReport

log = structlog.get_logger()

SYSTEM_PROMPT = """You are a senior quantitative financial analyst.
You produce structured, concise, actionable trend reports for financial professionals.
You output ONLY valid JSON matching exactly the schema given. No prose, no markdown fences, no preamble. Just the JSON object."""

SCHEMA = """{
  "report_title": "string",
  "executive_summary": "string (2-3 sentences, analyst voice)",
  "trend_direction": "bullish|bearish|neutral|volatile",
  "trend_confidence": 0-100,
  "key_signals": [{"signal": "string", "strength": "weak|moderate|strong", "direction": "positive|negative|neutral"}],
  "risk_assessment": {"overall_risk": "low|medium|high|critical", "risk_factors": ["string"], "risk_narrative": "string"},
  "web_intelligence": {"narrative_sentiment": "positive|negative|mixed|insufficient_data", "key_themes": ["string"], "notable_developments": "string or null"},
  "memory_insights": {"repeated_signals_detected": ["string"], "trend_persistence": "string or null", "emerging_risks": ["string"], "snapshots_referenced": 0},
  "actionable_takeaways": ["max 5 strings, each under 30 words"],
  "data_quality_notes": "string or null"
}"""


def build_prompt(trend: TrendAnalysis, scraped: list, memory: list, asset: str) -> str:
    scrape_text = ""
    if scraped:
        for s in scraped:
            scrape_text += f"\n---\nTitle: {s['title']}\nContent: {s['content'][:800]}\n"
    else:
        scrape_text = "No web sources provided."

    memory_text = ""
    if memory:
        for m in memory:
            memory_text += f"\n- [{m['created_at'][:10]}] Direction: {m['trend_direction']}, Risk: {m['risk_level']}, Signals: {', '.join(m['key_signals'][:3])}"
    else:
        memory_text = "No prior analysis found for this asset."

    return f"""Analyze this financial data and produce a report as JSON matching this exact schema:
{SCHEMA}

ASSET: {asset}
TREND DIRECTION: {trend.direction}
SLOPE: {trend.slope}
VOLATILITY (annualized): {trend.volatility}
RISK LEVEL: {trend.risk_level}
RISK FACTORS: {trend.risk_factors}
PERIOD CHANGES: {json.dumps(trend.period_changes)}
MOVING AVERAGES: {json.dumps(trend.moving_averages)}
PEAK: {trend.peak}
TROUGH: {trend.trough}
ANOMALIES DETECTED: {len(trend.anomalies)}

WEB INTELLIGENCE:
{scrape_text}

MEMORY CONTEXT (past analyses of this asset):
{memory_text}

Output only the JSON object. No markdown. No explanation."""


async def generate_report(
    trend: TrendAnalysis,
    scraped: list,
    memory: list,
    asset: str
) -> StructuredReport:
    if not settings.gemini_api_key:
        # Return a mock report if no API key set
        return StructuredReport(
            report_title=f"{asset} Financial Trend Report",
            executive_summary=f"Analysis indicates a {trend.direction} trend for {asset} with {trend.risk_level} risk. Volatility stands at {trend.volatility:.2%}. {len(trend.anomalies)} anomalous data points were detected.",
            trend_direction=trend.direction,
            trend_confidence=75.0,
            key_signals=[
                {"signal": f"{trend.direction.capitalize()} momentum", "strength": "moderate", "direction": "positive" if trend.direction == "bullish" else "negative"},
                {"signal": f"Volatility at {trend.volatility:.2%}", "strength": "strong" if trend.volatility > 0.3 else "weak", "direction": "neutral"},
            ],
            risk_assessment={"overall_risk": trend.risk_level, "risk_factors": trend.risk_factors, "risk_narrative": f"Risk is {trend.risk_level} based on detected factors."},
            web_intelligence={"narrative_sentiment": "insufficient_data", "key_themes": [], "notable_developments": None},
            memory_insights={"repeated_signals_detected": [], "trend_persistence": None, "emerging_risks": [], "snapshots_referenced": len(memory)},
            actionable_takeaways=[
                f"Monitor {asset} for continued {trend.direction} signals.",
                f"Peak value of {trend.peak['value']} reached on {trend.peak['date']}.",
                f"Risk level is currently {trend.risk_level} — review position sizing.",
            ],
            data_quality_notes="Report generated without LLM (no API key configured)."
        )

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = build_prompt(trend, scraped, memory, asset)
    full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=settings.llm_model,
                contents=full_prompt,
            )
            raw = (response.text or "").strip()
            if not raw:
                raise ValueError("LLM returned empty response")
            # Strip any accidental markdown fences
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw)
            return StructuredReport(**data)
        except json.JSONDecodeError as e:
            log.warning("llm_json_parse_error", attempt=attempt, error=str(e))
            if attempt == 1:
                raise ValueError(f"LLM returned invalid JSON after 2 attempts: {e}")
        except Exception as e:
            log.error("llm_error", error=str(e))
            raise
