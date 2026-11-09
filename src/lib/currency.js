export const USD_TO_PKR = 280 // update this to the current rate

export const toPKR = (usd) => Math.round(Number(usd) * USD_TO_PKR)

export const formatPKR = (usd) => `Rs ${toPKR(usd).toLocaleString('en-PK')}`