import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './Transaction.css'

function Transaction() {
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
    transactionsPerPage: 5,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [formData, setFormData] = useState({
    type: 'Expense',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Get user ID from localStorage
  const getUserId = () => {
    const userData = JSON.parse(localStorage.getItem('userData'))
    return userData?.uuid
  }

  // Fetch transactions from backend with pagination
  const fetchTransactions = async (page = 1, limit = 5) => {
    try {
      setLoading(true)
      const userId = getUserId()
      if (!userId) return

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_BASE_URL}/transaction-tracker/transactions/${userId}`, {
        params: {
          page: page,
          limit: limit,
          sortBy: 'date',
          sortOrder: 'desc'
        }
      })
      
      if (response.data.success) {
        setTransactions(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      alert('Error fetching transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Open modal for adding new transaction
  const openAddModal = () => {
    setEditingTransaction(null)
    setFormData({
      type: 'Expense',
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  // Open modal for editing transaction
  const openEditModal = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      date: transaction.date.split('T')[0]
    })
    setShowModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setEditingTransaction(null)
  }

  // Submit form (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.category || !formData.amount) {
      alert('Please fill all required fields')
      return
    }

    try {
      const userId = getUserId()
      const transactionData = {
        ...formData,
        userId,
        amount: parseFloat(formData.amount)
      }

      if (editingTransaction) {
        // Update transaction
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/transaction-tracker/transactions`, {
          action: 'update',
          id: editingTransaction._id,
          ...transactionData
        })
        if (response.data.success) {
          alert('Transaction updated successfully!')
          fetchTransactions(pagination.currentPage, pagination.transactionsPerPage)
          closeModal()
        }
      } else {
        // Add new transaction
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/transaction-tracker/transactions`, {
          action: 'add',
          ...transactionData
        })
        if (response.data.success) {
          alert('Transaction added successfully!')
          // Go to first page to see the new transaction (since we sort by date desc)
          fetchTransactions(1, pagination.transactionsPerPage)
          closeModal()
        }
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('Error saving transaction')
    }
  }

  // Delete transaction
  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/transaction-tracker/transactions`, {
          action: 'delete',
          id: transactionId
        })
        if (response.data.success) {
          alert('Transaction deleted successfully!')
          // Check if current page becomes empty after deletion
          const remainingOnCurrentPage = transactions.length - 1
          const targetPage = remainingOnCurrentPage === 0 && pagination.currentPage > 1 
            ? pagination.currentPage - 1 
            : pagination.currentPage
          fetchTransactions(targetPage, pagination.transactionsPerPage)
        }
      } catch (error) {
        console.error('Error deleting transaction:', error)
        alert('Error deleting transaction')
      }
    }
  }

  // Format amount in rupees
  const formatRupees = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  // Pagination logic - now handled by backend
  const paginate = (pageNumber) => {
    if (pageNumber !== pagination.currentPage) {
      fetchTransactions(pageNumber, pagination.transactionsPerPage)
    }
  }

  // Generate page numbers with smart ellipsis using backend pagination data
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    const { currentPage, totalPages } = pagination

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      if (currentPage <= 3) {
        // If current page is near the beginning
        for (let i = 2; i <= 4; i++) {
          pageNumbers.push(i)
        }
        if (totalPages > 4) {
          pageNumbers.push('...')
          pageNumbers.push(totalPages)
        }
      } else if (currentPage >= totalPages - 2) {
        // If current page is near the end
        pageNumbers.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        // If current page is in the middle
        pageNumbers.push('...')
        pageNumbers.push(currentPage - 1)
        pageNumbers.push(currentPage)
        pageNumbers.push(currentPage + 1)
        pageNumbers.push('...')
        pageNumbers.push(totalPages)
      }
    }

    return pageNumbers
  }

  return (
    <div className="transaction-container">
      <div className="transaction-header">
        <h1>Transactions</h1>
        <button className="add-btn" onClick={openAddModal}>
          + Add Transaction
        </button>
      </div>

      <div className="transaction-table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="loading">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>
                    <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>{transaction.category}</td>
                  <td className={transaction.type === 'Income' ? 'income-amount' : 'expense-amount'}>
                    {formatRupees(transaction.amount)}
                  </td>
                  <td>{formatDate(transaction.date)}</td>
                  <td className="actions">
                    <button 
                      className="edit-btn"
                      onClick={() => openEditModal(transaction)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(transaction._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No transactions found. Add your first transaction!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination with Page Numbers */}
      {pagination.totalPages > 1 && !loading && (
        <div className="pagination">
          {/* First Page Button */}
          <button 
            onClick={() => paginate(1)}
            disabled={!pagination.hasPreviousPage}
            className={`page-btn ${!pagination.hasPreviousPage ? 'disabled' : ''}`}
            title="First Page"
          >
            ⟨⟨
          </button>

          {/* Previous Button */}
          <button 
            onClick={() => paginate(pagination.previousPage)}
            disabled={!pagination.hasPreviousPage}
            className={`page-btn ${!pagination.hasPreviousPage ? 'disabled' : ''}`}
            title="Previous Page"
          >
            ⟨ Previous
          </button>
          
          {/* Page Numbers with Smart Ellipsis */}
          {getPageNumbers().map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === '...' ? (
                <span className="page-ellipsis">...</span>
              ) : (
                <button
                  onClick={() => paginate(pageNum)}
                  className={`page-btn page-number ${pagination.currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              )}
            </React.Fragment>
          ))}
          
          {/* Next Button */}
          <button 
            onClick={() => paginate(pagination.nextPage)}
            disabled={!pagination.hasNextPage}
            className={`page-btn ${!pagination.hasNextPage ? 'disabled' : ''}`}
            title="Next Page"
          >
            Next ⟩
          </button>

          {/* Last Page Button */}
          <button 
            onClick={() => paginate(pagination.totalPages)}
            disabled={!pagination.hasNextPage}
            className={`page-btn ${!pagination.hasNextPage ? 'disabled' : ''}`}
            title="Last Page"
          >
            ⟩⟩
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {pagination.totalPages > 1 && !loading && (
        <div className="pagination-info">
          Showing {((pagination.currentPage - 1) * pagination.transactionsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.transactionsPerPage, pagination.totalTransactions)} of {pagination.totalTransactions} transactions
          <span className="page-info">Page {pagination.currentPage} of {pagination.totalPages}</span>
        </div>
      )}

      {/* Modal for Add/Edit Transaction */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Type:</label>
                <select 
                  name="type" 
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category:</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Food, Salary, Transportation"
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount (₹):</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transaction