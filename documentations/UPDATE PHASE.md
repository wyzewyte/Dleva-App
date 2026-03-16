Update in this order to minimize errors:

PHASE 1 (Foundation):

1. Update axios.js → use apiConfig.BASE_URL
2. Update all auth services → use apiConfig

PHASE 2 (Services):
3. Update all service files → use apiConfig endpoints
4. Update deliveryService.js → use distanceCalculator + deliveryFeeTiers

PHASE 3 (UI Components):
5. Update all pages/components → use formatters, validators, messages
6. Update all status displays → use statusLabels

PHASE 4 (Error Handling):
7. Update all try/catch blocks → use errorHandler

This way, each phase builds on the previous one = zero dependency errors!