const { Router } = require('express');
const emailService = require('../services/EmailService');

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { prenom, email, parfum, note, commentaire } = req.body;

    if (!prenom || !email || !parfum || !note || !commentaire) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    await emailService.sendReviewNotification({ prenom, email, parfum, note, commentaire });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
