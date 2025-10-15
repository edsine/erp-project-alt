const express = require('express')
const router = express.Router()
const db = require('../db')

// Get all income records
router.get('/api/finance/income', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM income 
      ORDER BY date DESC, created_at DESC
    `)
    res.json(rows)
  } catch (error) {
    console.error('Error fetching income:', error)
    res.status(500).json({ error: 'Failed to fetch income records' })
  }
})

// Create new income record
router.post('/api/finance/income', async (req, res) => {
  try {
    const {
      day, month, week, voucher, transactionDetails,
      income, duty, wht, vat, grossAmount,
      incomeCentre, type, stamp, project, date
    } = req.body

    const query = `
      INSERT INTO income 
      (day, month, week, voucher, transaction_details, income, duty, wht, vat, gross_amount, income_centre, type, stamp, project, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const [result] = await db.execute(query, [
      day, month, week, voucher, transactionDetails,
      income, duty, wht, vat, grossAmount,
      incomeCentre, type, stamp, project, date
    ])

    const [newRecord] = await db.execute('SELECT * FROM income WHERE id = ?', [result.insertId])
    res.json(newRecord[0])
  } catch (error) {
    console.error('Error creating income:', error)
    res.status(500).json({ error: 'Failed to create income record' })
  }
})

// Update income record
router.put('/api/finance/income/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      day, month, week, voucher, transactionDetails,
      income, duty, wht, vat, grossAmount,
      incomeCentre, type, stamp, project
    } = req.body

    const query = `
      UPDATE income 
      SET day = ?, month = ?, week = ?, voucher = ?, transaction_details = ?,
          income = ?, duty = ?, wht = ?, vat = ?, gross_amount = ?,
          income_centre = ?, type = ?, stamp = ?, project = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    await db.execute(query, [
      day, month, week, voucher, transactionDetails,
      income, duty, wht, vat, grossAmount,
      incomeCentre, type, stamp, project, id
    ])

    const [updatedRecord] = await db.execute('SELECT * FROM income WHERE id = ?', [id])
    res.json(updatedRecord[0])
  } catch (error) {
    console.error('Error updating income:', error)
    res.status(500).json({ error: 'Failed to update income record' })
  }
})

// Delete income record
router.delete('/api/finance/income/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.execute('DELETE FROM income WHERE id = ?', [id])
    res.json({ message: 'Income record deleted successfully' })
  } catch (error) {
    console.error('Error deleting income:', error)
    res.status(500).json({ error: 'Failed to delete income record' })
  }
})

// Import multiple income records
router.post('/api/finance/income/import', async (req, res) => {
  try {
    const records = req.body
    const savedRecords = []

    for (const record of records) {
      const query = `
        INSERT INTO income 
        (day, month, week, voucher, transaction_details, income, duty, wht, vat, gross_amount, income_centre, type, stamp, project, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const [result] = await db.execute(query, [
        record.day, record.month, record.week, record.voucher, record.transactionDetails,
        record.income, record.duty, record.wht, record.vat, record.grossAmount,
        record.incomeCentre, record.type, record.stamp, record.project, record.date
      ])

      const [newRecord] = await db.execute('SELECT * FROM income WHERE id = ?', [result.insertId])
      savedRecords.push(newRecord[0])
    }

    res.json(savedRecords)
  } catch (error) {
    console.error('Error importing income:', error)
    res.status(500).json({ error: 'Failed to import income records' })
  }
})

// Get all expense records
router.get('/api/finance/expenses', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM expenses 
      ORDER BY date DESC, created_at DESC
    `)
    res.json(rows)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    res.status(500).json({ error: 'Failed to fetch expense records' })
  }
})

// Create new expense record
router.post('/api/finance/expenses', async (req, res) => {
  try {
    const {
      day, month, week, voucher, transactionDetails,
      spent, category, costCentre, subCostCentre, bankDebited, date
    } = req.body

    const query = `
      INSERT INTO expenses 
      (day, month, week, voucher, transaction_details, spent, category, cost_centre, sub_cost_centre, bank_debited, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const [result] = await db.execute(query, [
      day, month, week, voucher, transactionDetails,
      spent, category, costCentre, subCostCentre, bankDebited, date
    ])

    const [newRecord] = await db.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId])
    res.json(newRecord[0])
  } catch (error) {
    console.error('Error creating expense:', error)
    res.status(500).json({ error: 'Failed to create expense record' })
  }
})

// Update expense record
router.put('/api/finance/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      day, month, week, voucher, transactionDetails,
      spent, category, costCentre, subCostCentre, bankDebited
    } = req.body

    const query = `
      UPDATE expenses 
      SET day = ?, month = ?, week = ?, voucher = ?, transaction_details = ?,
          spent = ?, category = ?, cost_centre = ?, sub_cost_centre = ?, bank_debited = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    await db.execute(query, [
      day, month, week, voucher, transactionDetails,
      spent, category, costCentre, subCostCentre, bankDebited, id
    ])

    const [updatedRecord] = await db.execute('SELECT * FROM expenses WHERE id = ?', [id])
    res.json(updatedRecord[0])
  } catch (error) {
    console.error('Error updating expense:', error)
    res.status(500).json({ error: 'Failed to update expense record' })
  }
})

// Delete expense record
router.delete('/api/finance/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.execute('DELETE FROM expenses WHERE id = ?', [id])
    res.json({ message: 'Expense record deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    res.status(500).json({ error: 'Failed to delete expense record' })
  }
})

// Import multiple expense records
router.post('/api/finance/expenses/import', async (req, res) => {
  try {
    const records = req.body
    const savedRecords = []

    for (const record of records) {
      const query = `
        INSERT INTO expenses 
        (day, month, week, voucher, transaction_details, spent, category, cost_centre, sub_cost_centre, bank_debited, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const [result] = await db.execute(query, [
        record.day, record.month, record.week, record.voucher, record.transactionDetails,
        record.spent, record.category, record.costCentre, record.subCostCentre, record.bankDebited, record.date
      ])

      const [newRecord] = await db.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId])
      savedRecords.push(newRecord[0])
    }

    res.json(savedRecords)
  } catch (error) {
    console.error('Error importing expenses:', error)
    res.status(500).json({ error: 'Failed to import expense records' })
  }
})

module.exports = router