import numpy as np

def explain_prediction(text, model, vectorizer, top_n=5):
    """
    Explain the prediction by showing the most influential words.
    Returns a dictionary with 'contribution' list.
    """
    try:
        # Transform the single text
        input_vec = vectorizer.transform([text])
        
        # Get the feature names
        feature_names = vectorizer.get_feature_names_out()
        
        # Get coefficients (weights) for class 1 (Real) vs class 0 (Fake)
        # LogisticRegression coef_ is shape (1, n_features) for binary
        # Positive coef => pushes towards 1 (Real)
        # Negative coef => pushes towards 0 (Fake)
        coefs = model.coef_[0]
        
        # Get indices of words present in the input
        # input_vec is a sparse matrix, get non-zero indices
        _, col_indices = input_vec.nonzero()
        
        # Calculate contribution: weight * value (value is usually tf-idf score)
        contributions = []
        for idx in col_indices:
            word = feature_names[idx]
            weight = coefs[idx]
            val = input_vec[0, idx]
            impact = weight * val
            contributions.append({
                "word": word,
                "weight": weight,
                "impact": impact
            })
            
        # Determine the predicted class from the model
        pred_label = model.predict(input_vec)[0] # 1 or 0
        
        # If predicted Real (1), we want words with Positive impact
        # If predicted Fake (0), we want words with Negative impact
        
        if pred_label == 1:
            # Sort by impact descending (most positive first)
            contributions.sort(key=lambda x: x['impact'], reverse=True)
            relevant = [c for c in contributions if c['impact'] > 0]
        else:
            # Sort by impact ascending (most negative first)
            contributions.sort(key=lambda x: x['impact'])
            relevant = [c for c in contributions if c['impact'] < 0]
            
        # Take top N
        top_words = relevant[:top_n]
        
        return {
            "prediction": int(pred_label),
            "top_words": [w['word'] for w in top_words],
            "details": top_words
        }
        
    except Exception as e:
        print(f"Explanation error: {e}")
        return {"top_words": [], "details": []}
