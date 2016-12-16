const transactions = new Map();

const getTimeStamp = () => {
  const currentTimeMS = new Date().getTime();
  return Math.floor(currentTimeMS / 1000);
};

const addItemTransaction = (userID, itemPrice) => {
  let userTransactions = transactions.get(userID);
  if (userTransactions == null) {
    userTransactions = [];
  }
  const transaction = {
    date: getTimeStamp(),
    amount: -itemPrice,
  };
  userTransactions.push(transaction);
  transactions.set(userID, userTransactions);
};

// No concept of paging these transactions yet
const getTransactionHistory = userID => transactions.get(userID);

const getBalance = (userID) => {
  const userTransactions = getTransactionHistory(userID);
  return userTransactions.reduce((prev, current) => prev + current.amount, 0);
};

module.exports = { addItemTransaction, getBalance, getTransactionHistory };
