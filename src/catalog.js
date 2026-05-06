// Catalogue produits — remplacer par une base de données en production.
// Les prix sont en centimes (42 € → 4200).

const PRODUCTS = [
  {
    id: 'bvlgari-omnia-amethyste',
    name: 'Bvlgari Omnia Améthyste',
    description: 'Parfum de luxe floral aquatique',
    price: 4200,
    currency: 'EUR',
  },
  {
    id: 'von-paris-intense',
    name: 'Von Paris Intense',
    description: 'Eau de parfum intense',
    price: 4200,
    currency: 'EUR',
  },
  {
    id: 'aurodea-face-cream',
    name: 'Aurodea Face Cream',
    description: 'Crème visage premium',
    price: 3800,
    currency: 'EUR',
  },
  {
    id: 'olfazeta-ultra-oil',
    name: 'Olfazeta Ultra Oil',
    description: 'Huile corporelle de luxe',
    price: 3500,
    currency: 'EUR',
  },
  {
    id: 'paco-rabanne-olympea',
    name: 'Paco Rabanne Olympéa',
    description: 'Eau de parfum gourmande',
    price: 4200,
    currency: 'EUR',
  },
  {
    id: 'pack-printemps',
    name: 'Pack Printemps 4+1',
    description: 'Pack découverte 5 fragrances',
    price: 16800,
    currency: 'EUR',
  },
];

const productMap = new Map(PRODUCTS.map(p => [p.id, p]));

function getProduct(id) {
  return productMap.get(id) || null;
}

module.exports = { PRODUCTS, getProduct };
