const express = require('express');
const multer = require('multer');
const router = express.Router();
const db = require('../db');
const ExcelJS = require('exceljs');
const upload = multer({ storage: multer.memoryStorage() });


router.post('/income', async (req, res) => {
  try {
    const {
      transactionDate,
      voucherNo,
      transactionDetails,
      income,
      duty,
      wht,
      vat,
      incomeCentre,
      type,
      stamp,
      project,
      createdBy
    } = req.body

    const query = `
      INSERT INTO income_records
      (transaction_date, voucher_no, transaction_details, income, duty, wht, vat,
       income_centre, type, stamp, project, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const [result] = await db.execute(query, [
      transactionDate,
      voucherNo,
      transactionDetails,
      income,
      duty,
      wht,
      vat,
      incomeCentre,
      type,
      stamp,
      project,
      createdBy
    ])

    const [record] = await db.execute(
      'SELECT * FROM income_records WHERE id = ?',
      [result.insertId]
    )

    res.json(record[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create income record' })
  }
});

router.post('/income/import-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const sheet = workbook.worksheets[0];
    const rows = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      rows.push({
        transactionDate: row.getCell(1).value,
        voucherNo: row.getCell(2).value,
        transactionDetails: row.getCell(3).value,
        income: row.getCell(4).value || 0,
        duty: row.getCell(5).value || 0,
        wht: row.getCell(6).value || 0,
        vat: row.getCell(7).value || 0,
        incomeCentre: row.getCell(8).value,
        type: row.getCell(9).value,
        stamp: row.getCell(10).value,
        project: row.getCell(11).value
      });
    });

    const insertQuery = `
      INSERT INTO income_records
      (transaction_date, voucher_no, transaction_details,
       income, duty, wht, vat,
       income_centre, type, stamp, project, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const r of rows) {
      await db.execute(insertQuery, [
        r.transactionDate,
        r.voucherNo,
        r.transactionDetails,
        r.income,
        r.duty,
        r.wht,
        r.vat,
        r.incomeCentre,
        r.type,
        r.stamp,
        r.project,
        1 // createdBy (Finance user)
      ]);
    }

    res.json({
      message: 'Excel income import successful',
      recordsInserted: rows.length
    });
  } catch (err) {
    console.error('❌ EXCEL IMPORT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});



router.get('/income/export', async (req, res) => {
  try {
    const { from, to } = req.query;

    let where = '';
    const params = [];

    if (from && to) {
      where = 'WHERE transaction_date BETWEEN ? AND ?';
      params.push(from, to);
    }

    const [rows] = await db.execute(
      `
      SELECT
        transaction_date,
        voucher_no,
        transaction_details,
        income,
        duty,
        wht,
        vat,
        gross_amount,
        income_centre,
        type,
        stamp,
        project
      FROM income_records
      ${where}
      ORDER BY transaction_date ASC
      `,
      params
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Income');

    sheet.columns = [
      { header: 'Date', key: 'transaction_date', width: 15 },
      { header: 'Voucher', key: 'voucher_no', width: 15 },
      { header: 'Transaction Details', key: 'transaction_details', width: 40 },
      { header: 'Income', key: 'income', width: 15 },
      { header: 'Duty', key: 'duty', width: 15 },
      { header: 'WHT', key: 'wht', width: 15 },
      { header: 'VAT', key: 'vat', width: 15 },
      { header: 'Gross Amount', key: 'gross_amount', width: 18 },
      { header: 'Income Centre', key: 'income_centre', width: 20 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Stamp', key: 'stamp', width: 15 },
      { header: 'Project', key: 'project', width: 20 }
    ];

    rows.forEach(row => {
      sheet.addRow({
        ...row,
        transaction_date: row.transaction_date
          .toISOString()
          .split('T')[0]
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=income.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('❌ INCOME EXPORT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});




router.get('/income', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        DAY(transaction_date) AS day,
        MONTHNAME(transaction_date) AS month,
        WEEK(transaction_date) AS week,
        voucher_no,
        transaction_details,
        income,
        duty,
        wht,
        vat,
        gross_amount,
        income_centre,
        type,
        stamp,
        project,
        transaction_date
      FROM income_records
      ORDER BY transaction_date DESC
    `)

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch income records' })
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
      duty,
      wht,
      vat,
      incomeCentre,
      type,
      stamp,
      project
    } = req.body

    const query = `
      UPDATE income_records
      SET
        transaction_date = ?,
        voucher_no = ?,
        transaction_details = ?,
        income = ?,
        duty = ?,
        wht = ?,
        vat = ?,
        income_centre = ?,
        type = ?,
        stamp = ?,
        project = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    await db.execute(query, [
      transactionDate,
      voucherNo,
      transactionDetails,
      income,
      duty,
      wht,
      vat,
      incomeCentre,
      type,
      stamp,
      project,
      id
    ])

    const [updated] = await db.execute(
      'SELECT * FROM income_records WHERE id = ?',
      [id]
    )

    res.json(updated[0])
  } catch (err) {
    console.error(err)
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


router.post('/income/import', async (req, res) => {
  try {
    const records = req.body

    for (const r of records) {
      await db.execute(
        `
        INSERT INTO income_records
        (transaction_date, voucher_no, transaction_details, income, duty, wht, vat,
         income_centre, type, stamp, project, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          r.transactionDate,
          r.voucherNo,
          r.transactionDetails,
          r.income,
          r.duty,
          r.wht,
          r.vat,
          r.incomeCentre,
          r.type,
          r.stamp,
          r.project,
          r.createdBy
        ]
      )
    }

    res.json({ message: 'Income records imported successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to import income records' })
  }
})


router.post('/expenses', async (req, res) => {
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

    const [result] = await db.execute(
      `
      INSERT INTO expense_records
      (transaction_date, voucher_no, transaction_details, spent,
       category, cost_centre, sub_cost_centre, bank_debited, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        transactionDate,
        voucherNo,
        transactionDetails,
        spent,
        category,
        costCentre,
        subCostCentre,
        bankDebited,
        createdBy
      ]
    )

    const [record] = await db.execute(
      'SELECT * FROM expense_records WHERE id = ?',
      [result.insertId]
    )

    res.json(record[0])
  } catch (err) {
    console.error('❌ EXPENSE ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})



router.get('/expenses', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT
      id,
      DAY(transaction_date) AS day,
      MONTHNAME(transaction_date) AS month,
      WEEK(transaction_date) AS week,
      voucher_no,
      transaction_details,
      spent,
      category,
      cost_centre,
      sub_cost_centre,
      bank_debited,
      transaction_date
    FROM expense_records
    ORDER BY transaction_date DESC
  `)

  res.json(rows)
})









module.exports = router