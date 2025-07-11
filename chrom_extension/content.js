console.log("🛡️ AI Defender Extension: content.js loaded!");

// 1. Send a batch of text and page URL to the Flask backend
async function analyzeBatch(texts) {
  try {
    const response = await fetch("http://127.0.0.1:5000/analyze_batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts,
        url: window.location.href,
      }),
    });

    if (!response.ok) {
      console.error("❌ API error:", response.status);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ AI Defender batch fetch error:", error);
    return [];
  }
}

// 2. Blur the toxic element with tooltip
function blurElement(el) {
  el.classList.add("blur-text");
  el.title = "🚫 Blurred by AI Defender (Toxic or Harmful Content)";
}

// 3. Determine if the result is toxic
function isTextToxicSemantic(res) {
  if (!res || !res.label || !res.multi_labels) return false;

  const text = res.text?.toLowerCase() || "";

  // BERT-based toxicity + high risk
  if (res.label.toLowerCase() === "toxic" && res.risk_score >= 66) return true;

  // Roberta multi-label toxicity
  const toxicLabels = ["threat", "insult", "obscene", "sexual_explicit", "severe_toxicity"];
  for (const label of toxicLabels) {
    if (res.multi_labels[label] !== undefined && res.multi_labels[label] >= 0.5) {
      return true;
    }
  }

  // Extra sensitive phrase matching
  const sexualAbusePhrases = [
    "she was raped", "i was molested", "he assaulted me", "sexual assault",
    "she was sexually abused", "he tried to rape", "i was abused",
    "child molestation", "she was harassed", "rape survivor"
  ];
  return sexualAbusePhrases.some(phrase => text.includes(phrase));
}

// 4. Scan DOM, analyze, and blur toxic content
async function scanAndBlurBatch() {
  const elements = Array.from(document.querySelectorAll("p, span, li, td, blockquote, div"));

  const candidates = elements.filter(el => {
    const text = el.innerText.trim();
    return text.length > 10 && !el.classList.contains("blur-text");
  });

  if (candidates.length === 0) return;

  const texts = candidates.map(el => el.innerText.trim());
  const results = await analyzeBatch(texts);

  results.forEach((res, idx) => {
    if (isTextToxicSemantic(res)) {
      blurElement(candidates[idx]);
      console.log("🔒 Blurred toxic text:", candidates[idx].innerText.trim());
    }
  });
}

// 5. Initial scan and periodic rescans
scanAndBlurBatch();
setInterval(scanAndBlurBatch, 5000);

// 6. Mutation observer for dynamic websites
const observer = new MutationObserver(() => {
  scanAndBlurBatch();
});
observer.observe(document.body, { childList: true, subtree: true });

// 7. Inject CSS for blurred content
const style = document.createElement("style");
style.innerHTML = `
.blur-text {
  filter: blur(6px);
  cursor: not-allowed;
  transition: 0.3s;
}
.blur-text:hover {
  filter: none;
}
`;
document.head.appendChild(style);