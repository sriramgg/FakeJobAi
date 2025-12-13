# Ai/backend/utils/preprocess.py
import re, string
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    nltk_available = True
except Exception:
    nltk_available = False

if nltk_available:
    try:
        STOPWORDS = set(stopwords.words("english"))
    except:
        STOPWORDS = set()
    LE = WordNetLemmatizer()
else:
    STOPWORDS = set()
    LE = None

def simple_tokenize(text):
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = text.split()
    return tokens

def clean_text(text: str) -> str:
    if text is None: return ""
    text = str(text).lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if nltk_available:
        try:
            tokens = [w for w in nltk.word_tokenize(text) if w not in STOPWORDS]
            if LE:
                tokens = [LE.lemmatize(t) for t in tokens]
        except Exception:
            tokens = simple_tokenize(text)
    else:
        tokens = simple_tokenize(text)
    return " ".join(tokens)
