// console.log("AI Defender Extension: content.js loaded!");

// // 1. Sends a batch of text content and current page URL to your Flask backend
// async function analyzeBatch(texts) {
//   try {
//     const response = await fetch("http://127.0.0.1:5000/analyze_batch", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ 
//         texts,
//         url: window.location.href  // send current page URL
//       }),
//     });

//     if (!response.ok) {
//       console.error("API response not OK:", response.status);
//       return [];
//     }

//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("AI Defender batch API error:", error);
//     return [];
//   }
// }

// // 2. Apply blur effect + tooltip for flagged content
// function blurElement(el) {
//   el.classList.add("blur-text");
//   el.title = "Blurred due to harmful/offensive content";
// }

// // 3. Semantic-based filtering (meaning-based, not keywords)
// // Flags if a sentence is toxic according to either BERT or Roberta model
// function isTextToxicSemantic(res) {
//   if (!res || !res.label || !res.multi_labels) return false;

//   const text = res.text?.toLowerCase() || "";

//   // BERT-based toxic label + confidence
//   if (res.label.toLowerCase() === "toxic" && res.risk_score >= 75) return true;

//   // Roberta-based multi-label check
//   const toxicLabels = ["obscene", "identity_attack", "insult", "threat", "sexual_explicit", "severe_toxicity"];
//   for (const label of toxicLabels) {
//     if (res.multi_labels[label] !== undefined && res.multi_labels[label] >= 0.5) {
//       return true;
//     }
//   }

//   // Sexual assault phrase detection (semantic filtering)
//   const sexualAssaultPhrases = [
//     "she was raped", "i was molested", "he assaulted me", "sexual assault",
//     "she was sexually abused", "he tried to rape", "i was abused",
//     "child molestation", "she was harassed", "rape survivor"
//   ];
//   for (const phrase of sexualAssaultPhrases) {
//     if (text.includes(phrase)) {
//       return true;
//     }
//   }

//   return false;
// }

// // 4. Main logic: scan page, collect visible text, analyze, and blur toxic ones
// async function scanAndBlurBatch() {
//   const elements = Array.from(document.querySelectorAll("p, span, li, td, blockquote"));

//   const candidates = elements.filter(el => {
//     const text = el.innerText.trim();
//     return text.length > 10 && !el.classList.contains("blur-text");
//   });

//   if (candidates.length === 0) return;

//   const texts = candidates.map(el => el.innerText.trim());

//   const results = await analyzeBatch(texts);

//   results.forEach((res, idx) => {
//     if (isTextToxicSemantic(res)) {
//       blurElement(candidates[idx]);
//       console.log(`Blurred toxic sentence: ${candidates[idx].innerText.trim()}`);
//     }
//   });
// }

// // 5. Run initial scan and continuously rescan every 5 seconds
// scanAndBlurBatch();
// setInterval(scanAndBlurBatch, 5000);

// // 6. Watch for dynamically added elements (SPA support)
// const observer = new MutationObserver(() => {
//   scanAndBlurBatch();
// });
// observer.observe(document.body, { childList: true, subtree: true });

console.log("🛡️ AI Defender Extension: content.js loaded!");

// 1. Send batch of text and URL to Flask backend
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

// 2. Blur the element + tooltip
function blurElement(el) {
  el.classList.add("blur-text");
  el.title = "🚫 Blurred by AI Defender (Toxic or Harmful Content)";
}

// 3. Check if a result is toxic (semantic + multi-label logic)
function isTextToxicSemantic(res) {
  if (!res || !res.label || !res.multi_labels) return false;

  const text = res.text?.toLowerCase() || "";

  // BERT-based toxicity + high risk
  if (res.label.toLowerCase() === "toxic" && res.risk_score >= 66) return true;

  // Roberta multi-label toxicity flags
  const toxicLabels = ["threat", "insult", "obscene", "sexual_explicit", "severe_toxicity"];
  for (const label of toxicLabels) {
    if (res.multi_labels[label] !== undefined && res.multi_labels[label] >= 0.5) {
      return true;
    }
  }

  // Extra sensitive phrase matching (for sexual abuse etc.)
  const sexualAssaultPhrases = [
    "she was raped", "i was molested", "he assaulted me", "sexual assault",
    "she was sexually abused", "he tried to rape", "i was abused",
    "child molestation", "she was harassed", "rape survivor"
  ];
  return sexualAssaultPhrases.some(phrase => text.includes(phrase));
}

// 4. Main: Scan DOM, analyze, blur if toxic
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

// 6. Support for dynamic Single Page Applications (SPA)
const observer = new MutationObserver(() => {
  scanAndBlurBatch();
});
observer.observe(document.body, { childList: true, subtree: true });

// 7. Optional: Add CSS if not already present
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
