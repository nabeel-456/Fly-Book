export const seatPrice = (flightPrice, seatClass) =>
  Math.round(Number(flightPrice) * (seatClass === 'business' ? 1.8 : 1) * 100) / 100