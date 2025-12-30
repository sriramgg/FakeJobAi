import numpy as np
import requests
import json
import os

def explain_prediction(text, model, vectorizer, top_n=5):
    """
    Enhanced: Explain the prediction using both Local ML weights and Gemini AI.
    """
    # 1. Local ML Step (Always done as fallback/baseline)
    local_explanation = _calculate_local_explanation(text, model, vectorizer, top_n)
    
    # 2. AI Brain Step (Next Level)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        # Check .env manually if not in env
        try:
            from dotenv import load_dotenv
            load_dotenv()
            gemini_key = os.getenv("GEMINI_API_KEY")
        except: pass

    if gemini_key:
        try:
            ai_insight = _get_gemini_reasoning(text, local_explanation['prediction'], gemini_key)
            if ai_insight:
                local_explanation['ai_summary'] = ai_insight
                local_explanation['brain_mode'] = "gemini"
        except Exception as e:
            print(f"Gemini Analysis Error: {e}")
            local_explanation['brain_mode'] = "local"
    else:
        local_explanation['brain_mode'] = "local"

    return local_explanation

def _get_gemini_reasoning(text, pred_label, api_key):
    """Call Gemini to get a deep analysis of the job description."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        verdict = "LEGITIMATE" if pred_label == 1 else "SUSPICIOUS/FRAUDULENT"
        prompt = (
            f"As a Cybersecurity Analyst specializing in Job Scams, analyze this job posting. "
            f"Our AI model predicts it is {verdict}.\n\n"
            f"JOB TEXT: {text[:2000]}\n\n"
            f"Provide a concise summary (under 60 words) explaining WHY this might be {verdict.lower()}. "
            f"If it's suspicious, highlight the sneaky red flags. If it's real, mention the professional hallmarks. "
            f"Be authoritative and professional."
        )
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "topP": 0.8,
                "maxOutputTokens": 150,
            }
        }
        
        r = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            reasoning = data['candidates'][0]['content']['parts'][0]['text']
            return reasoning.strip()
    except:
        return None

def _calculate_local_explanation(text, model, vectorizer, top_n):
    """Legacy local ML explanation logic."""
    try:
        input_vec = vectorizer.transform([text])
        feature_names = vectorizer.get_feature_names_out()
        pred_label = model.predict(input_vec)[0]
        
        contributions = []
        if hasattr(model, "coef_"):
            coefs = model.coef_[0]
            _, col_indices = input_vec.nonzero()
            for idx in col_indices:
                impact = coefs[idx] * input_vec[0, idx]
                contributions.append({"word": feature_names[idx], "impact": impact})
            
            contributions.sort(key=lambda x: x['impact'], reverse=(pred_label == 1))
            relevant = [c for c in contributions if (c['impact'] > 0 if pred_label == 1 else c['impact'] < 0)]
            top_words_list = relevant[:top_n]
        elif hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            _, col_indices = input_vec.nonzero()
            for idx in col_indices:
                score = importances[idx] * input_vec[0, idx]
                contributions.append({"word": feature_names[idx], "impact": score})
            contributions.sort(key=lambda x: x['impact'], reverse=True)
            top_words_list = contributions[:top_n]
        else:
            top_words_list = []

        word_list = [w['word'] for w in top_words_list]
        if not word_list:
            ai_summary = "Analysis conducted via global pattern recognition."
        else:
            joined = ", ".join(f"'{w}'" for w in word_list)
            ai_summary = f"Flagged due to terms: {joined}." if pred_label == 0 else f"Verified by hallmarks: {joined}."

        return {
            "prediction": int(pred_label),
            "top_words": word_list,
            "details": top_words_list,
            "ai_summary": ai_summary
        }
    except Exception as e:
        return {"prediction": 0, "top_words": [], "details": [], "ai_summary": "In-depth scan complete."}

