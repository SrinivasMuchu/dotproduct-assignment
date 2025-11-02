import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExpenseChart from '../Charts/ExpenseChart';
import './Dashboard.css';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [updatingBudget, setUpdatingBudget] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
    
    // Fetch transaction data
    fetchTransactionSummary();
  }, []);

  useEffect(() => {
    // Check if user needs to set budget after data is loaded
    if (userData && !loading && (userData.budget === 0 || !userData.budget)) {
      setShowBudgetModal(true);
    }
  }, [userData, loading]);

  // Get user ID from localStorage
  const getUserId = () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    return userData?.uuid;
  };

  // Fetch transaction summary
  const fetchTransactionSummary = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      if (!userId) return;

      const response = await axios.get(`http://localhost:5050/transaction-tracker/transactions/${userId}`, {
        params: { limit: 1000 } // Get all transactions for accurate totals
      });

      if (response.data.success) {
        const transactions = response.data.data;
        
        // Calculate totals
        let expenses = 0;
        let income = 0;

        transactions.forEach(transaction => {
          if (transaction.type === 'Expense') {
            expenses += transaction.amount;
          } else if (transaction.type === 'Income') {
            income += transaction.amount;
          }
        });

        setTotalExpenses(expenses);
        setTotalIncome(income);
      }
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update user budget
  const updateUserBudget = async () => {
    try {
      setUpdatingBudget(true);
      const userId = getUserId();
      
      if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
        alert('Please enter a valid budget amount');
        return;
      }

      const response = await axios.post('http://localhost:5050/tracker/update-budget', {
        userId: userId,
        budget: parseFloat(budgetAmount)
      });

      if (response.data.success) {
        // Update localStorage
        const updatedUserData = { ...userData, budget: parseFloat(budgetAmount) };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        setShowBudgetModal(false);
        setBudgetAmount('');
        alert('Budget updated successfully!');
      } else {
        alert(response.data.message || 'Error updating budget');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Error updating budget. Please try again.');
    } finally {
      setUpdatingBudget(false);
    }
  };

  // Handle budget modal close (only if budget is set)
  const handleBudgetModalClose = () => {
    if (userData?.budget && userData.budget > 0) {
      setShowBudgetModal(false);
    } else {
      alert('Please set your budget to continue using the dashboard');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Calculate remaining budget
  const remainingBudget = userData?.budget ? userData.budget - totalExpenses : 0;

  if (loading) {
    return <div className="dashboard-loading">Loading your data...</div>;
  }

  if (!userData) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Budget Setup Modal */}
      {showBudgetModal && (
        <div className="modal-overlay">
          <div className="budget-modal">
            <h2>Set Your Monthly Budget</h2>
            <p>Please set your monthly budget to continue using the dashboard.</p>
            <div className="budget-input-group">
              <label htmlFor="budgetAmount">Monthly Budget (₹)</label>
              <input
                type="number"
                id="budgetAmount"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Enter your monthly budget"
                min="1"
                step="0.01"
              />
            </div>
            <div className="modal-buttons">
              <button 
                onClick={updateUserBudget}
                disabled={updatingBudget || !budgetAmount}
                className="btn-primary"
              >
                {updatingBudget ? 'Updating...' : 'Set Budget'}
              </button>
              {userData?.budget > 0 && (
                <button 
                  onClick={handleBudgetModalClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <h1>Welcome {userData?.name || 'User'}!</h1>
        <p>Track your expenses and manage your budget</p>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="card budget-card">
            <h3>Monthly Budget</h3>
            <p className="amount">{formatCurrency(userData.budget || 0)}</p>
            <button 
              onClick={() => setShowBudgetModal(true)}
              className="update-budget-btn"
            >
              Update Budget
            </button>
          </div>
          
          <div className="card income-card">
            <h3>Total Income</h3>
            <p className="amount income">{formatCurrency(totalIncome)}</p>
          </div>
          
          <div className="card expenses-card">
            <h3>Total Expenses</h3>
            <p className="amount expenses">{formatCurrency(totalExpenses)}</p>
          </div>
          
          <div className="card remaining-card">
            <h3>Remaining Budget</h3>
            <p className={`amount ${remainingBudget < 0 ? 'negative' : remainingBudget === 0 ? 'zero' : 'positive'}`}>
              {formatCurrency(remainingBudget)}
            </p>
            {remainingBudget < 0 && (
              <small className="warning">You've exceeded your budget!</small>
            )}
          </div>
        </div>

        {/* Expense Chart Section */}
        <div className="dashboard-chart-section">
          <ExpenseChart />
        </div>
       
      </div>
    </div>
  );
}

export default Dashboard;