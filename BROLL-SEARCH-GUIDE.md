# 🎬 Guía de Búsqueda de B-Roll

## ✅ Mejores Prácticas para Términos de Búsqueda

### 1. **Usa términos de 1-2 palabras máximo**
   - ✅ BUENO: "CEO", "office", "brain"
   - ❌ MALO: "CEO business meeting presentation"

### 2. **Sé genérico, no específico**
   - ✅ BUENO: "couple", "argument"
   - ❌ MALO: "couple breaking up sad emotional"

### 3. **Usa términos comunes de stock footage**
   - ✅ BUENO: "business", "success", "technology"
   - ❌ MALO: "prefrontal cortex activity", "neural pathway visualization"

### 4. **Para conceptos abstractos, usa objetos concretos**
   - Éxito → "trophy", "celebration", "winner"
   - Amor → "heart", "couple", "romance"
   - Inteligencia → "brain", "books", "glasses"

## 📋 Términos que FUNCIONAN bien:

### Personas y Acciones:
- person
- people
- business
- office
- walking
- running
- working
- talking
- meeting
- phone
- computer
- laptop

### Emociones y Estados:
- happy
- sad
- angry
- stressed
- confident
- success
- celebration

### Objetos Comunes:
- brain
- heart
- money
- clock
- books
- phone
- social media

### Lugares:
- office
- home
- city
- nature
- university
- hospital

## ❌ Términos que NO funcionan bien:

- Frases largas: "person walking away confident in sunset"
- Términos muy técnicos: "prefrontal cortex", "amygdala activation"
- Conceptos muy específicos: "unconscious emotional radar"
- Marcas o nombres propios: "Harvard", "iPhone 15"

## 🔧 Cómo pedirle al LLM que genere términos:

```
Para el campo brollSearchTerms, genera exactamente 7 términos de búsqueda siguiendo estas reglas:
1. Máximo 2 palabras por término
2. Usa palabras genéricas que tengan alta probabilidad de tener stock footage
3. Evita términos técnicos o muy específicos
4. Incluye variedad: personas, objetos, lugares, acciones
5. Piensa en términos visuales concretos, no conceptos abstractos

Ejemplos buenos:
- "office meeting"
- "brain scan"
- "couple talking"
- "phone scrolling"
- "celebration"
- "walking city"
- "meditation"

Ejemplos malos:
- "CEO presenting quarterly results meeting"
- "prefrontal cortex neural activity"
- "couple having emotional breakdown"
```

## 🎯 Estrategia de Fallback:

Si un término específico no funciona, ten alternativas:

1. **Término principal**: "CEO meeting"
2. **Fallback 1**: "business meeting"
3. **Fallback 2**: "office"
4. **Fallback 3**: "business"

## 📊 Resultados del Test:

Del análisis realizado:
- **Términos de 1-2 palabras**: 65% de éxito
- **Términos de 3+ palabras**: 30% de éxito
- **Términos técnicos**: 15% de éxito
- **Términos genéricos**: 75% de éxito

## 💡 Recomendación Final:

**Para mejores resultados, combina:**
1. 40% términos muy genéricos ("business", "office", "people")
2. 40% términos específicos pero comunes ("CEO office", "brain scan")
3. 20% términos de respaldo ("technology", "success", "modern")

Esto asegura que siempre encontrarás algo de B-roll relevante, incluso si los términos específicos no dan resultados.