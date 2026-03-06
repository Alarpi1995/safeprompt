/**
 * SafePrompt - Common Names Dictionary
 * Detects personal names directly without context keywords.
 * Uses common first names across multiple cultures.
 *
 * @license GPL-3.0-only
 */

const SafePromptNames = {
  // Common English first names (male + female)
  en: [
    'James','John','Robert','Michael','David','William','Richard','Joseph','Thomas','Christopher',
    'Charles','Daniel','Matthew','Anthony','Mark','Donald','Steven','Andrew','Paul','Joshua',
    'Kenneth','Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan',
    'Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon',
    'Benjamin','Samuel','Raymond','Gregory','Frank','Alexander','Patrick','Jack','Dennis','Jerry',
    'Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen',
    'Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Dorothy','Kimberly','Emily','Donna',
    'Michelle','Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia',
    'Kathleen','Amy','Angela','Shirley','Anna','Brenda','Pamela','Emma','Nicole','Helen',
    'Samantha','Katherine','Christine','Debra','Rachel','Carolyn','Janet','Catherine','Maria','Heather',
  ],

  // Common Arabic first names
  ar: [
    'محمد','أحمد','عبدالله','عبدالرحمن','علي','حسن','حسين','خالد','سعد','فهد',
    'عمر','عثمان','إبراهيم','يوسف','سالم','ناصر','فيصل','بندر','سلطان','ماجد',
    'طارق','سامي','وليد','هشام','ياسر','عادل','صالح','نواف','تركي','مشاري',
    'عبدالعزيز','سعود','بدر','مشعل','نايف','متعب','منصور','راشد','حمد','زياد',
    'فاطمة','عائشة','مريم','نورة','سارة','هند','لطيفة','منيرة','أمل','ريم',
    'نوف','دلال','هيا','بسمة','لمى','غادة','سلمى','رنا','دانة','لجين',
    'جوهرة','ابتسام','وفاء','سمية','حصة','مها','نجلاء','ليلى','رقية','أسماء',
  ],

  // Common Spanish first names
  es: [
    'Carlos','Miguel','José','Juan','Pedro','Luis','Antonio','Francisco','Manuel','Diego',
    'Alejandro','Fernando','Ricardo','Eduardo','Jorge','Pablo','Andrés','Sergio','Raúl','Mario',
    'María','Ana','Carmen','Laura','Isabel','Pilar','Lucía','Elena','Rosa','Cristina',
    'Marta','Teresa','Beatriz','Patricia','Rocío','Sara','Paula','Andrea','Silvia','Raquel',
  ],

  // Common French first names
  fr: [
    'Jean','Pierre','Michel','Jacques','Philippe','André','Nicolas','François','Alain','Bernard',
    'Marie','Jeanne','Françoise','Monique','Catherine','Nathalie','Isabelle','Sylvie','Anne','Sophie',
    'Camille','Lucas','Hugo','Louis','Léa','Emma','Chloé','Manon','Inès','Jade',
  ],

  // Common German first names
  de: [
    'Hans','Klaus','Wolfgang','Peter','Jürgen','Dieter','Thomas','Michael','Andreas','Stefan',
    'Ursula','Monika','Petra','Sabine','Andrea','Claudia','Karin','Birgit','Heike','Susanne',
    'Maximilian','Alexander','Lukas','Felix','Leon','Jonas','Luca','Tim','Elias','Ben',
  ],

  // Common Portuguese first names
  pt: [
    'João','José','Pedro','Paulo','Carlos','Lucas','Gabriel','Mateus','Rafael','Bruno',
    'Maria','Ana','Juliana','Fernanda','Camila','Beatriz','Larissa','Letícia','Amanda','Bruna',
    'Miguel','Arthur','Bernardo','Heitor','Davi','Lorenzo','Théo','Alice','Sophia','Helena',
  ],

  // Common Chinese names (characters)
  zh: [
    '王伟','李娜','张伟','刘洋','陈静','杨军','赵敏','黄勇','周杰','吴芳',
    '徐明','孙丽','马超','朱红','胡强','郭华','林峰','何平','高磊','罗敏',
  ],

  /**
   * Build a regex pattern for name detection.
   * Names are detected when they appear as standalone capitalized words.
   */
  buildPattern(lang) {
    const names = this[lang];
    if (!names || names.length === 0) return null;

    if (lang === 'zh') {
      // Chinese names: exact match for 2-3 char combinations
      return names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    }

    if (lang === 'ar') {
      // Arabic names: word boundary match
      return names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    }

    // Latin-script names: case-sensitive word boundary
    return '\\b(?:' + names.join('|') + ')\\b';
  },
};

if (typeof window !== 'undefined') window.SafePromptNames = SafePromptNames;
if (typeof module !== 'undefined') module.exports = { SafePromptNames };
