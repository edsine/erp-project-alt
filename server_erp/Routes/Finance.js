const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const router = express.Router();
const db = require('../db');


// ================= HELPERS ================= 
// const normalize = (row, keys) => {
//   if (!row || !keys) return null

//   const keyList = Array.isArray(keys) ? keys : [keys]

//   const foundKey = Object.keys(row).find(k =>
//     keyList.some(
//       alias => k.toLowerCase().trim() === alias.toLowerCase().trim()
//     )
//   )

//   return foundKey ? row[foundKey] : null
// }


const normalize = (row, keys) => {
  if (!row || !keys) return null
  const list = Array.isArray(keys) ? keys : [keys]

  const foundKey = Object.keys(row).find(k => {
    const cleaned = k
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]/g, '')
      .trim()

    return list.some(
      alias => cleaned === alias.toLowerCase().trim()
    )
  })

  return foundKey ? row[foundKey] : null
}


const safeText = (val, fallback = '') => {
  if (val === undefined || val === null) return fallback
  const str = String(val).trim()
  return str.length ? str : fallback
}

const safeNumber = (val, fallback = 0) => {
  const num = Number(val)
  return isNaN(num) ? fallback : num
}

const safeTransactionDate = (row) => {
  const raw = normalize(row, 'DATE')

  if (!raw) return new Date()

  // Excel serial date
  if (typeof raw === 'number') {
    const excelEpoch = new Date(1899, 11, 30)
    return new Date(excelEpoch.getTime() + raw * 86400000)
  }

  const parsed = new Date(raw)
  return isNaN(parsed) ? new Date() : parsed
}

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(process.cwd(), 'uploads/income')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const upload = multer({ storage })


router.post('/income', async (req, res) => {
  try {
    const {
      transactionDate,
      voucherNo,
      transactionDetails,
      income,
      stamp,
      wht,
      vat,
      incomeCentre,
      projectType,
      project,
      createdBy
    } = req.body

    // ✅ SAFETY DEFAULTS (critical)
    const safeValues = {
      transactionDate: transactionDate || new Date().toISOString().split('T')[0],
      voucherNo: voucherNo?.trim() || 'AUTO',
      transactionDetails: transactionDetails?.trim() || 'New income entry',
      income: Number(income) || 0,
      stamp: Number(stamp) || 0,
      wht: Number(wht) || 0,
      vat: Number(vat) || 0,
      incomeCentre: incomeCentre?.trim() || 'GENERAL',
      projectType: projectType?.trim() || 'GENERAL',
      project: project || null,
      createdBy: createdBy || 1
    }

    const query = `
      INSERT INTO income_records
      (
        transaction_date,
        voucher_no,
        transaction_details,
        income,
        stamp,
        wht,
        vat,
        income_centre,
        project_type,
        project,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const values = [
      safeValues.transactionDate,
      safeValues.voucherNo,
      safeValues.transactionDetails,
      safeValues.income,
      safeValues.stamp,
      safeValues.wht,
      safeValues.vat,
      safeValues.incomeCentre,
      safeValues.projectType,
      safeValues.project,
      safeValues.createdBy
    ]

    // 🔍 TEMP LOG (remove later)
    console.log('CREATE INCOME VALUES:', values)

    const [result] = await db.execute(query, values)

    const [rows] = await db.execute(
      'SELECT * FROM income_records WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    console.error('CREATE INCOME ERROR:', err)
    res.status(500).json({
      error: 'Failed to create income record',
      message: err.message
    })
  }
})



// router.post('/income', async (req, res) => {
//   try {
//     const {
//       transactionDate,
//       voucherNo,
//       transactionDetails,
//       income,
//       stamp,
//       wht,
//       vat,
//       incomeCentre,
//       type,
//       project,
//       createdBy
//     } = req.body

//     const query = `
//       INSERT INTO income_records
//       (transaction_date, voucher_no, transaction_details,
//        income, stamp, wht, vat,
//        income_centre, type, project, created_by)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `

//     const values = [
//       transactionDate ?? null,
//       voucherNo ?? null,
//       transactionDetails ?? null,
//       income ?? 0,
//       stamp ?? 0,
//       wht ?? 0,
//       vat ?? 0,
//       incomeCentre ?? null,
//       type ?? null,
//       project ?? null,
//       createdBy ?? null
//     ]

//     const [result] = await db.execute(query, values)


//     const [record] = await db.execute(
//       'SELECT * FROM income_records WHERE id = ?',
//       [result.insertId]
//     )

//     res.json(record[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: 'Failed to create income record' })
//   }
// })


// GET /api/finance/income
// router.get('/income', async (req, res) => {
//   try {
//     const [records] = await db.execute(`
//       SELECT *
//       FROM income_records
//       ORDER BY transaction_date DESC, created_at DESC
//     `)

//     res.json(records)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: 'Failed to fetch income records' })
//   }
// })



// DELETE /api/finance/income/:id
// router.delete('/income/:id', async (req, res) => {
//   try {
//     const { id } = req.params

//     const [result] = await db.execute(
//       'DELETE FROM income_records WHERE id = ?',
//       [id]
//     )

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Income record not found' })
//     }

//     res.json({ message: 'Income record deleted successfully' })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: 'Failed to delete income record' })
//   }
// })





// ================= ROUTE =================
router.post('/income/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No Excel file uploaded' })
  }

  try {
    const workbook = XLSX.readFile(req.file.path)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    // 1️⃣ Read sheet as raw rows
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      raw: false
    })

    // 2️⃣ Find header row
    const headerIndex = rows.findIndex(row =>
      row.some(
        cell =>
          typeof cell === 'string' &&
          cell.toLowerCase().includes('date')
      )
    )

    if (headerIndex === -1) {
      return res.status(400).json({ error: 'Header row not found in Excel file' })
    }

    const headers = rows[headerIndex].map(h =>
      String(h).toLowerCase().trim()
    )

    // 3️⃣ Column mapping
    const col = {
      date: headers.indexOf('date'),
      voucher: headers.findIndex(h => h.includes('code')),
      details: headers.findIndex(h => h.includes('details')),
      income: headers.findIndex(h => h.includes('income')),
      stamp: headers.findIndex(h => h.includes('stamp')),
      wht: headers.findIndex(h => h.includes('wht')),
      vat: headers.findIndex(h => h.includes('vat')),
      centre: headers.findIndex(h => h.includes('centre')),
      projectType: headers.findIndex(h => h.includes('project'))
    }

    const dataRows = rows.slice(headerIndex + 1)

    let inserted = 0
    let skipped = 0

    // 4️⃣ Insert rows
    for (const r of dataRows) {
      const date = r[col.date]
      const voucher = r[col.voucher]
      const income = r[col.income]

      if (!date || !voucher || !income) {
        skipped++
        continue
      }

      // ✅ Safe Excel date handling
      const parsedDate =
        typeof date === 'number'
          ? new Date(Math.round((date - 25569) * 86400 * 1000))
          : new Date(date)

      await db.execute(
        `
        INSERT INTO income_records
        (
          transaction_date,
          voucher_no,
          transaction_details,
          income,
          stamp,
          wht,
          vat,
          income_centre,
          project_type,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          parsedDate,
          voucher,
          r[col.details] || 'Imported record',
          Number(income) || 0,
          Number(r[col.stamp]) || 0,
          Number(r[col.wht]) || 0,
          Number(r[col.vat]) || 0,
          r[col.centre] || 'GENERAL',
          r[col.projectType] || 'GENERAL',
          1
        ]
      )

      inserted++
    }

    fs.unlinkSync(req.file.path)

    res.json({
      message: 'Excel import completed',
      inserted,
      skipped,
      total: dataRows.length
    })
  } catch (err) {
    console.error('IMPORT ERROR:', err)
    res.status(500).json({ error: 'Failed to import Excel file' })
  }
})


// GET /api/finance/income/table
router.get('/income/table', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        transaction_date,
        voucher_no,
        transaction_details,
        income,
        stamp,
        wht,
        vat,
        income_centre,
        project_type
      FROM income_records
      ORDER BY transaction_date DESC
    `)

    res.json(rows)
  } catch (err) {
    console.error('INCOME TABLE ERROR:', err)
    res.status(500).json({ error: 'Failed to fetch income table data' })
  }
})

router.get('/income/download', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        transaction_date AS DATE,
        voucher_no AS "VOUCHER CODE",
        transaction_details AS "TRANSACTION DETAILS",
        income AS INCOME,
        stamp AS "STAMP DUTY",
        wht AS WHT,
        vat AS VAT,
        gross_amount AS "GROSS AMOUNT",
        income_centre AS "INCOME CENTRE",
        project_type AS "PROJECT TYPE"
      FROM income_records
      ORDER BY transaction_date DESC
    `)

    if (!rows.length) {
      return res.status(404).json({ error: 'No income records found' })
    }

    // Create worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Records')

    // Set headers for download
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=income_records.xlsx'
    )
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    // Send file
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    })

    res.send(buffer)
  } catch (err) {
    console.error('DOWNLOAD ERROR:', err)
    res.status(500).json({ error: 'Failed to download income records' })
  }
})




router.put('/income/:id', async (req, res) => {
  try {
    const { id } = req.params

    const {
      transactionDate,
      voucherNo,
      transactionDetails,
      income,
      stamp,
      vat,
      wht,
      incomeCentre,
      projectType,
      project
    } = req.body

    const query = `
      UPDATE income_records SET
        transaction_date = ?,
        voucher_no = ?,
        transaction_details = ?,
        income = ?,
        stamp = ?,
        vat = ?,
        wht = ?,
        income_centre = ?,
        project_type = ?,
        project = ?
      WHERE id = ?
    `

    const values = [
      transactionDate,
      voucherNo,
      transactionDetails,
      income ?? 0,
      stamp ?? 0,
      vat ?? 0,
      wht ?? 0,
      incomeCentre,
      projectType,
      project ?? null,
      id
    ]

    await db.execute(query, values)

    const [rows] = await db.execute(
      'SELECT * FROM income_records WHERE id = ?',
      [id]
    )

    res.json(rows[0])
  } catch (err) {
    console.error('UPDATE INCOME ERROR:', err)
    res.status(500).json({ error: 'Failed to update income record' })
  }
})


router.delete('/income/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM income_records WHERE id = ?', [req.params.id])
    res.json({ message: 'Income record deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete income record' })
  }
})








router.post('/expense', async (req, res) => {
  try {
    const {
      transactionDate,
      voucherNo,
      transactionDetails,
      spent,
      category,
      costCentre,
      subCostCentre,
      bankDebited,
      createdBy
    } = req.body

    const query = `
      INSERT INTO expense_records
      (transaction_date, voucher_no, transaction_details,
       spent, category, cost_centre, sub_cost_centre,
       bank_debited, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const values = [
      transactionDate ?? null,
      voucherNo ?? null,
      transactionDetails ?? '',
      spent ?? 0,
      category ?? '',
      costCentre ?? '',
      subCostCentre ?? null,
      bankDebited ?? null,
      createdBy ?? null
    ]

    const [result] = await db.execute(query, values)

    const [rows] = await db.execute(
      'SELECT * FROM expense_records WHERE id = ?',
      [result.insertId]
    )

    res.json(rows[0])
  } catch (err) {
    console.error('CREATE EXPENSE ERROR:', err)
    res.status(500).json({ error: 'Failed to create expense record' })
  }
})

router.get('/expense', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT *
      FROM expense_records
      ORDER BY transaction_date DESC, id DESC
    `)

    res.json(rows)
  } catch (err) {
    console.error('GET EXPENSES ERROR:', err)
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})

router.get('/expense/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await db.execute(
      'SELECT * FROM expense_records WHERE id = ?',
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error('GET EXPENSE BY ID ERROR:', err)
    res.status(500).json({ error: 'Failed to fetch expense' })
  }
})

router.delete('/expense/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [result] = await db.execute(
      'DELETE FROM expense_records WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    res.json({ message: 'Expense deleted successfully' })
  } catch (err) {
    console.error('DELETE EXPENSE ERROR:', err)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})




router.put('/expense/:id', async (req, res) => {
  try {
    const { id } = req.params

    const {
      transactionDate,
      voucherNo,
      transactionDetails,
      spent,
      category,
      costCentre,
      subCostCentre,
      bankDebited
    } = req.body

    const query = `
      UPDATE expense_records SET
        transaction_date = ?,
        voucher_no = ?,
        transaction_details = ?,
        spent = ?,
        category = ?,
        cost_centre = ?,
        sub_cost_centre = ?,
        bank_debited = ?
      WHERE id = ?
    `

    const values = [
      transactionDate ?? null,
      voucherNo ?? null,
      transactionDetails ?? '',
      spent ?? 0,
      category ?? '',
      costCentre ?? '',
      subCostCentre ?? null,
      bankDebited ?? null,
      id
    ]

    await db.execute(query, values)

    const [rows] = await db.execute(
      'SELECT * FROM expense_records WHERE id = ?',
      [id]
    )

    res.json(rows[0])
  } catch (err) {
    console.error('UPDATE EXPENSE ERROR:', err)
    res.status(500).json({ error: 'Failed to update expense record' })
  }
})


router.get('/report', async (req, res) => {
  try {
    /** TOTAL INCOME */
    const [[incomeTotal]] = await db.execute(`
      SELECT 
        COALESCE(SUM(income + vat + stamp - wht), 0) AS total_income
      FROM income_records
    `)

    /** TOTAL EXPENSES */
    const [[expenseTotal]] = await db.execute(`
      SELECT 
        COALESCE(SUM(spent), 0) AS total_expenses
      FROM expense_records
    `)

    /** INCOME BY MONTH */
    const [incomeByMonth] = await db.execute(`
      SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') AS month,
        SUM(income + vat + stamp - wht) AS income
      FROM income_records
      GROUP BY month
      ORDER BY month
    `)

    /** EXPENSES BY MONTH */
    const [expensesByMonth] = await db.execute(`
      SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') AS month,
        SUM(spent) AS expenses
      FROM expense_records
      GROUP BY month
      ORDER BY month
    `)

    /** MERGE MONTHLY COMPARISON */
    const months = new Set([
      ...incomeByMonth.map(i => i.month),
      ...expensesByMonth.map(e => e.month)
    ])

    const monthlyComparison = Array.from(months).map(month => {
      const income = incomeByMonth.find(i => i.month === month)?.income || 0
      const expenses = expensesByMonth.find(e => e.month === month)?.expenses || 0

      return {
        month,
        income,
        expenses,
        profitLoss: income - expenses
      }
    }).sort((a, b) => a.month.localeCompare(b.month))

    res.json({
      totalIncome: incomeTotal.total_income,
      totalExpenses: expenseTotal.total_expenses,
      netProfitLoss: incomeTotal.total_income - expenseTotal.total_expenses,
      incomeByMonth,
      expensesByMonth,
      monthlyComparison
    })
  } catch (err) {
    console.error('FINANCIAL REPORT ERROR:', err)
    res.status(500).json({ error: 'Failed to generate financial report' })
  }
})




module.exports = router