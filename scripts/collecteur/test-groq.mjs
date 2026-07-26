import 'dotenv/config';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testerGroq() {
  console.log('Test de connexion à Groq...\n');

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: 'Réponds juste avec: "Connexion Groq OK, ça marche !"' }
      ]
    });

    console.log('✓ Réponse reçue:');
    console.log(completion.choices[0].message.content);
    console.log('\nModèle utilisé:', completion.model);
    console.log('Tokens utilisés:', completion.usage);
  } catch (err) {
    console.error('✗ Erreur:', err.message);
    if (err.status === 401) {
      console.error('→ Vérifie que ta clé GROQ_API_KEY est correcte dans .env');
    }
  }
}

testerGroq();
