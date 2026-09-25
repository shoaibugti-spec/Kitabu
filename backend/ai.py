"""
کِتٰٰبُ کی retrieval-only سوال جواب منطق۔

یہ module کسی LLM یا external AI service کو call نہیں کرتا۔ سوال کے دعوائی
markers کو پہچان کر حوالہ مانگتا ہے، ورنہ QuranSearch سے متعلقہ آیات دکھاتا ہے۔
"""


class QuranAI:
    def __init__(self, search_engine):
        self.search = search_engine

    def answer(self, question: str, lang: str = "ur"):
        if self._is_claim(question):
            return {
                "type": "claim_detected",
                "found": False,
                "message": (
                    "لگتا ہے آپ قرآن کے بارے میں کوئی بات کہہ رہے ہیں۔ "
                    "براہ کرم آیت نمبر دیں تاکہ میں تصدیق کر سکوں۔\n\n"
                    "مثال: 'سورہ 2، آیت 255 میں کہا گیا ہے کہ اللہ زندہ ہے'"
                ),
                "verses": [],
            }

        results = self.search.find(question, lang=lang)
        if not results:
            return {
                "type": "not_found",
                "found": False,
                "message": (
                    "اس مخصوص موضوع پر قرآن میں کوئی صریح آیت نہیں ملی۔\n"
                    "یہ نہیں کہا جا سکتا کہ قرآن میں یہ بات نہیں ہے — "
                    "شاید مختلف الفاظ میں ہو۔ براہ کرم دوسرے الفاظ میں پوچھیں۔"
                ),
                "verses": [],
            }

        return {
            "type": "found",
            "found": True,
            "message": f"قرآن میں {len(results)} متعلقہ آیات ملیں۔",
            "verses": results,
        }

    @staticmethod
    def _is_claim(question: str) -> bool:
        claim_markers = (
            "قرآن میں یہ ہے",
            "قرآن میں ہے",
            "اسلام میں",
            "اللہ نے کہا",
            "نبی نے کہا",
            "حدیث میں",
            "یہ آیت",
            "اس آیت میں",
        )
        return any(marker in question.strip() for marker in claim_markers)
