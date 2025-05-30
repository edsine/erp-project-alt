const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new memo
router.post('/memos', (req, res) => {
    const { title, content, created_by } = req.body;

    if (!title || !content || !created_by) {
        return res.status(400).json({ message: 'Title, content, and created_by are required.' });
    }

    const sql = `
    INSERT INTO memos (title, content, created_by)
    VALUES (?, ?, ?)
  `;

    db.query(sql, [title, content, created_by], (err, result) => {
        if (err) {
            console.error('Error creating memo:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        return res.status(201).json({
            message: 'Memo created successfully',
            memo_id: result.insertId
        });
    });
});


// GET /memos - fetch all memos
router.get('/memos', (req, res) => {
    const sql = 'SELECT * FROM memos ORDER BY created_at DESC';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching memos:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        return res.status(200).json(results);
    });
});


router.get('/memos/user/:userId', (req, res) => {
  const { userId } = req.params;

  // First query: Get user details
  db.query('SELECT * FROM users WHERE id = ?', [userId], (userErr, userRows) => {
    if (userErr) {
      console.error('Error fetching user:', userErr);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRows[0];
    let query = '';
    let queryParams = [];

    // Determine query based on user role
    switch (user.role) {
      case 'gmd':
        query = `
  SELECT * FROM memos
  WHERE 
    (approved_by_gmd = 0)
    OR (approved_by_gmd = 1 AND approved_by_finance = 1 AND approved_by_gmd2 = 0)
`;

        break;
      case 'finance':
        query = 'SELECT * FROM memos WHERE approved_by_finance = 0';
        break;
      case 'chairman':
        query = 'SELECT * FROM memos WHERE approved_by_chairman = 0';
        break;
      case 'manager':
        query = 'SELECT * FROM memos WHERE status = "in_review"';
        break;
      default:
        query = 'SELECT * FROM memos WHERE created_by = ?';
        queryParams = [userId];
    }

    // Second query: Get memos
    db.query(query, queryParams, (memoErr, memos) => {
      if (memoErr) {
        console.error('Error fetching memos:', memoErr);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      res.json({ success: true, data: memos });
    });
  });
});



//another logic havent tested yet
// router.get('/memos/user/:userId', (req, res) => {
//   const { userId } = req.params;

//   db.query('SELECT * FROM users WHERE id = ?', [userId], (userErr, userRows) => {
//     if (userErr) {
//       console.error('Error fetching user:', userErr);
//       return res.status(500).json({ success: false, message: 'Internal server error' });
//     }

//     if (userRows.length === 0) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const user = userRows[0];
//     let query = '';
//     let queryParams = [];

//     switch (user.role) {
//       case 'gmd':
//         // GMD should see memos needing GMD approval (either first or second)
//         query = `
//           SELECT m.* 
//           FROM memos m
//           JOIN users u ON m.created_by = u.id
//           WHERE (m.approved_by_gmd = 0 OR m.approved_by_gmd2 = 0)
//         `;
//         break;
//       case 'finance':
//         // Finance should see memos that have passed GMD approval but need finance
//         query = `
//           SELECT m.* 
//           FROM memos m
//           JOIN users u ON m.created_by = u.id
//           WHERE m.approved_by_gmd = 1 
//             AND m.approved_by_gmd2 = 1 
//             AND m.approved_by_finance = 0
//         `;
//         break;
//       case 'chairman':
//         // Chairman should see memos that have passed finance but need chairman
//         query = `
//           SELECT m.* 
//           FROM memos m
//           JOIN users u ON m.created_by = u.id
//           WHERE m.approved_by_finance = 1 
//             AND m.approved_by_chairman = 0
//         `;
//         break;
//       case 'manager':
//         // Managers see memos from their department
//         query = `
//           SELECT m.* 
//           FROM memos m
//           JOIN users u ON m.created_by = u.id
//           WHERE u.department = ?
//         `;
//         queryParams = [user.department];
//         break;
//       default:
//         // Staff only see their own memos
//         query = 'SELECT * FROM memos WHERE created_by = ?';
//         queryParams = [userId];
//     }

//     db.query(query, queryParams, (memoErr, memos) => {
//       if (memoErr) {
//         console.error('Error fetching memos:', memoErr);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//       }

//       res.json({ success: true, data: memos });
//     });
//   });
// });


// Get by ID route with visibility control








// GET /memos/:id - fetch a specific memo by ID
router.get('/memos/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM memos WHERE id = ?';

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching memo by ID:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Memo not found' });
        }

        return res.status(200).json(results[0]);
    });
});

//not faulty just alil buggy...in use

// router.post('/memos/:id/approve', (req, res) => {
//   const memoId = req.params.id;
//   const { user_id } = req.body;

//   if (!user_id) {
//     return res.status(400).json({ message: 'User ID is required.' });
//   }

//   // Step 1: Get the user's role
//   const userQuery = 'SELECT role FROM users WHERE id = ?';
//   db.query(userQuery, [user_id], (err, userResult) => {
//     if (err) {
//       console.error('Error fetching user:', err);
//       return res.status(500).json({ message: 'Database error' });
//     }

//     if (userResult.length === 0) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     const role = userResult[0].role;
//     let columnToUpdate = null;

//     // Step 2: Determine the column based on role
//     switch (role) {
//       case 'gmd':
//         columnToUpdate = 'approved_by_gmd';
//         break;
//       case 'finance':
//         columnToUpdate = 'approved_by_finance';
//         break;
//       case 'gmd2':
//         columnToUpdate = 'approved_by_gmd2';
//         break;
//       case 'chairman':
//         columnToUpdate = 'approved_by_chairman';
//         break;
//       default:
//         return res.status(403).json({ message: 'User is not authorized to approve memos.' });
//     }

//     // Step 3: Update the memo with the approval
//     const approveQuery = `UPDATE memos SET ${columnToUpdate} = 1 WHERE id = ?`;
//     db.query(approveQuery, [memoId], (err, result) => {
//       if (err) {
//         console.error('Error updating memo:', err);
//         return res.status(500).json({ message: 'Database error during approval' });
//       }

//       if (result.affectedRows === 0) {
//         return res.status(404).json({ message: 'Memo not found.' });
//       }

//       return res.status(200).json({
//         message: `Memo approved by ${role}`,
//         memo_id: memoId,
//         approved_by: role
//       });
//     });
//   });
// });

//puurrrfect but lets see if we can sling better
// router.post('/memos/:id/approve', async (req, res) => {
//   const memoId = req.params.id;
//   const { user_id } = req.body;

//   if (!user_id) {
//     return res.status(400).json({ message: 'User ID is required for approval.' });
//   }

//   const userSql = 'SELECT role FROM users WHERE id = ?';
//   db.query(userSql, [user_id], (userErr, userResults) => {
//     if (userErr || userResults.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const role = userResults[0].role;

//   const roleApprovalMap = {
//   gmd: { field: 'approved_by_gmd', dependsOn: null },
//   finance: { field: 'approved_by_finance', dependsOn: 'approved_by_gmd' },
//   gmd2: { field: 'approved_by_gmd2', dependsOn: 'approved_by_finance' },
//   chairman: { field: 'approved_by_chairman', dependsOn: 'approved_by_gmd2' }
// };


//     const roleInfo = roleApprovalMap[role];

//     if (!roleInfo) {
//       return res.status(403).json({ message: 'User role is not authorized to approve' });
//     }

//     const { field, dependsOn } = roleInfo;

//     const checkSql = `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM memos WHERE id = ?`;
//     db.query(checkSql, [memoId], (checkErr, checkResults) => {
//       if (checkErr || checkResults.length === 0) {
//         return res.status(404).json({ message: 'Memo not found' });
//       }

//       const memo = checkResults[0];

//       if (memo[field] === 1) {
//         return res.status(400).json({ message: `Already approved by ${role}` });
//       }

//       if (dependsOn && memo[dependsOn] !== 1) {
//         return res.status(403).json({ message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.` });
//       }

//       const updateSql = `UPDATE memos SET ${field} = 1 WHERE id = ?`;
//       db.query(updateSql, [memoId], (updateErr) => {
//         if (updateErr) {
//           return res.status(500).json({ message: 'Error updating approval status' });
//         }

//         return res.status(200).json({ message: `Memo approved by ${role}` });
//       });
//     });
//   });
// });

//the best version probably it version 3.0
router.post('/memos/:id/approve', async (req, res) => {
    const memoId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required for approval.' });
    }

    const roleApprovalMap = {
        gmd: { field: 'approved_by_gmd', dependsOn: null },
        finance: { field: 'approved_by_finance', dependsOn: 'approved_by_gmd' },
        gmd2: { field: 'approved_by_gmd2', dependsOn: 'approved_by_finance' },
        chairman: { field: 'approved_by_chairman', dependsOn: 'approved_by_gmd2' }
    };

    const userSql = 'SELECT role FROM users WHERE id = ?';
    db.query(userSql, [user_id], (userErr, userResults) => {
        if (userErr || userResults.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const role = userResults[0].role;

        if (!roleApprovalMap[role]) {
            return res.status(403).json({ message: 'User role is not authorized to approve' });
        }

        // Handle GMD special case (gmd & gmd2)
        if (role === 'gmd') {
            const checkSql = `SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2 FROM memos WHERE id = ?`;
            db.query(checkSql, [memoId], (checkErr, checkResults) => {
                if (checkErr || checkResults.length === 0) {
                    return res.status(404).json({ message: 'Memo not found' });
                }

                const memo = checkResults[0];

                if (memo.approved_by_gmd === 0) {
                    // First GMD approval
                    const updateSql = `UPDATE memos SET approved_by_gmd = 1 WHERE id = ?`;
                    db.query(updateSql, [memoId], (updateErr) => {
                        if (updateErr) {
                            return res.status(500).json({ message: 'Error updating GMD approval' });
                        }
                        return res.status(200).json({ message: 'Approved by GMD' });
                    });
                } else if (memo.approved_by_gmd === 1 && memo.approved_by_finance === 1 && memo.approved_by_gmd2 === 0) {
                    // Second GMD approval (GMD2)
                    const updateSql = `UPDATE memos SET approved_by_gmd2 = 1 WHERE id = ?`;
                    db.query(updateSql, [memoId], (updateErr) => {
                        if (updateErr) {
                            return res.status(500).json({ message: 'Error updating GMD2 approval' });
                        }
                        return res.status(200).json({ message: 'Approved by GMD2' });
                    });
                } else {
                    return res.status(400).json({ message: 'Cannot approve at this stage or already approved' });
                }
            });
        } else {
            // All other roles (finance, chairman)
            const { field, dependsOn } = roleApprovalMap[role];
            const checkSql = `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM memos WHERE id = ?`;
            db.query(checkSql, [memoId], (checkErr, checkResults) => {
                if (checkErr || checkResults.length === 0) {
                    return res.status(404).json({ message: 'Memo not found' });
                }

                const memo = checkResults[0];

                if (memo[field] === 1) {
                    return res.status(400).json({ message: `Already approved by ${role}` });
                }

                if (dependsOn && memo[dependsOn] !== 1) {
                    return res.status(403).json({
                        message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
                    });
                }

                const updateSql = `UPDATE memos SET ${field} = 1 WHERE id = ?`;
                db.query(updateSql, [memoId], (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({ message: 'Error updating approval status' });
                    }

                    return res.status(200).json({ message: `Memo approved by ${role}` });
                });

                // Check if all approvals are completed
                const checkAllApprovalsSql = `
  SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2, approved_by_chairman
  FROM memos
  WHERE id = ?
`;
                db.query(checkAllApprovalsSql, [memoId], (err, results) => {
                    if (!err && results.length > 0) {
                        const allApproved = Object.values(results[0]).every(val => val === 1);
                        if (allApproved) {
                            db.query(`UPDATE memos SET status = 'approved' WHERE id = ?`, [memoId]);
                        }
                    }
                });

            });
        }
    });
});



//prototype
// router.post('/memos/:id/approve', async (req, res) => {
//   const memoId = req.params.id;
//   const { user_id } = req.body;

//   if (!user_id) {
//     return res.status(400).json({ message: 'User ID is required for approval.' });
//   }

//   const roleApprovalMap = {
//     gmd: { field: 'approved_by_gmd', dependsOn: null },
//     finance: { field: 'approved_by_finance', dependsOn: 'approved_by_gmd' },
//     gmd2: { field: 'approved_by_gmd2', dependsOn: 'approved_by_finance' },
//     chairman: { field: 'approved_by_chairman', dependsOn: 'approved_by_gmd2' }
//   };

//   const userSql = 'SELECT role FROM users WHERE id = ?';
//   db.query(userSql, [user_id], (userErr, userResults) => {
//     if (userErr || userResults.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const role = userResults[0].role;

//     if (!roleApprovalMap[role]) {
//       return res.status(403).json({ message: 'User role is not authorized to approve' });
//     }

//     // Special case for GMD who approves twice
//     if (role === 'gmd') {
//       const checkSql = `SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2 FROM memos WHERE id = ?`;
//       db.query(checkSql, [memoId], (checkErr, checkResults) => {
//         if (checkErr || checkResults.length === 0) {
//           return res.status(404).json({ message: 'Memo not found' });
//         }

//         const memo = checkResults[0];

//         if (memo.approved_by_gmd === 0) {
//           // First GMD approval
//           const updateSql = `UPDATE memos SET approved_by_gmd = 1 WHERE id = ?`;
//           db.query(updateSql, [memoId], (updateErr) => {
//             if (updateErr) {
//               return res.status(500).json({ message: 'Error updating GMD approval' });
//             }
//             return res.status(200).json({ message: 'Approved by GMD' });
//           });
//         } else if (memo.approved_by_gmd === 1 && memo.approved_by_finance === 1 && memo.approved_by_gmd2 === 0) {
//           // GMD as GMD2
//           const updateSql = `UPDATE memos SET approved_by_gmd2 = 1 WHERE id = ?`;
//           db.query(updateSql, [memoId], (updateErr) => {
//             if (updateErr) {
//               return res.status(500).json({ message: 'Error updating GMD2 approval' });
//             }

//             // Check for all approvals
//             checkAndUpdateFinalStatus(memoId);
//             return res.status(200).json({ message: 'Approved by GMD2' });
//           });
//         } else {
//           return res.status(400).json({ message: 'Cannot approve at this stage or already approved' });
//         }
//       });
//     } else {
//       // For finance and chairman
//       const { field, dependsOn } = roleApprovalMap[role];
//       const checkSql = `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM memos WHERE id = ?`;

//       db.query(checkSql, [memoId], (checkErr, checkResults) => {
//         if (checkErr || checkResults.length === 0) {
//           return res.status(404).json({ message: 'Memo not found' });
//         }

//         const memo = checkResults[0];

//         if (memo[field] === 1) {
//           return res.status(400).json({ message: `Already approved by ${role}` });
//         }

//         if (dependsOn && memo[dependsOn] !== 1) {
//           return res.status(403).json({
//             message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
//           });
//         }

//         const updateSql = `UPDATE memos SET ${field} = 1 WHERE id = ?`;
//         db.query(updateSql, [memoId], (updateErr) => {
//           if (updateErr) {
//             return res.status(500).json({ message: 'Error updating approval status' });
//           }

//           // 🔁 Check for final approval status only after successful update
//           checkAndUpdateFinalStatus(memoId);
//           return res.status(200).json({ message: `Memo approved by ${role}` });
//         });
//       });
//     }
//   });

//   // ✅ Function to check and update final status
//   function checkAndUpdateFinalStatus(memoId) {
//     const checkAllSql = `
//       SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2, approved_by_chairman
//       FROM memos
//       WHERE id = ?
//     `;
//     db.query(checkAllSql, [memoId], (err, results) => {
//       if (!err && results.length > 0) {
//         const allApproved = Object.values(results[0]).every(val => val === 1);
//         if (allApproved) {
//           db.query(`UPDATE memos SET status = 'approved' WHERE id = ?`, [memoId]);
//         }
//       }
//     });
//   }
// });



router.post('/memos/:id/approve', (req, res) => {
  const memoId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required for approval.' });
  }

  const roleApprovalMap = {
    gmd: { field: 'approved_by_gmd', dependsOn: null },
    finance: { field: 'approved_by_finance', dependsOn: 'approved_by_gmd' },
    gmd2: { field: 'approved_by_gmd2', dependsOn: 'approved_by_finance' },
    chairman: { field: 'approved_by_chairman', dependsOn: 'approved_by_gmd2' }
  };

  const userSql = 'SELECT role FROM users WHERE id = ?';
  db.query(userSql, [user_id], (userErr, userResults) => {
    if (userErr || userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role;

    if (!roleApprovalMap[role]) {
      return res.status(403).json({ message: 'User role is not authorized to approve' });
    }

    if (role === 'gmd') {
      const gmdCheckSql = `SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2 FROM memos WHERE id = ?`;
      db.query(gmdCheckSql, [memoId], (checkErr, checkResults) => {
        if (checkErr || checkResults.length === 0) {
          return res.status(404).json({ message: 'Memo not found' });
        }

        const memo = checkResults[0];

        if (memo.approved_by_gmd === 0) {
          // First GMD approval
          const updateSql = `UPDATE memos SET approved_by_gmd = 1 WHERE id = ?`;
          db.query(updateSql, [memoId], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ message: 'Error updating GMD approval' });
            }
            return res.status(200).json({ message: 'Approved by GMD', field: 'approved_by_gmd' });
          });
        } else if (memo.approved_by_gmd === 1 && memo.approved_by_finance === 1 && memo.approved_by_gmd2 === 0) {
          // GMD acting as GMD2 after Finance
          const updateSql = `UPDATE memos SET approved_by_gmd2 = 1 WHERE id = ?`;
          db.query(updateSql, [memoId], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ message: 'Error updating GMD2 approval' });
            }
            return res.status(200).json({ message: 'Approved by GMD2', field: 'approved_by_gmd2' });
          });
        } else {
          return res.status(400).json({ message: 'GMD cannot approve at this stage or already approved' });
        }
      });
    } else {
      const { field, dependsOn } = roleApprovalMap[role];
      const checkSql = `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM memos WHERE id = ?`;
      db.query(checkSql, [memoId], (checkErr, checkResults) => {
        if (checkErr || checkResults.length === 0) {
          return res.status(404).json({ message: 'Memo not found' });
        }

        const memo = checkResults[0];

        if (memo[field] === 1) {
          return res.status(400).json({ message: `Already approved by ${role}` });
        }

        if (dependsOn && memo[dependsOn] !== 1) {
          return res.status(403).json({
            message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
          });
        }

        const updateSql = `UPDATE memos SET ${field} = 1 WHERE id = ?`;
        db.query(updateSql, [memoId], (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: 'Error updating approval status' });
          }
          return res.status(200).json({ message: `Approved by ${role}`, field });
        });
      });
    }
  });
});

router.post('/memos/:id/reject', (req, res) => {
  const memoId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required for rejection.' });
  }

  const roleApprovalMap = {
    gmd: { field: 'approved_by_gmd', dependsOn: null },
    finance: { field: 'approved_by_finance', dependsOn: 'approved_by_gmd' },
    gmd2: { field: 'approved_by_gmd2', dependsOn: 'approved_by_finance' },
    chairman: { field: 'approved_by_chairman', dependsOn: 'approved_by_gmd2' }
  };

  const userSql = 'SELECT role FROM users WHERE id = ?';
  db.query(userSql, [user_id], (userErr, userResults) => {
    if (userErr || userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role;

    if (!roleApprovalMap[role]) {
      return res.status(403).json({ message: 'User role is not authorized to reject' });
    }

    if (role === 'gmd') {
      const gmdCheckSql = `SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2 FROM memos WHERE id = ?`;
      db.query(gmdCheckSql, [memoId], (checkErr, checkResults) => {
        if (checkErr || checkResults.length === 0) {
          return res.status(404).json({ message: 'Memo not found' });
        }

        const memo = checkResults[0];

        if (memo.approved_by_gmd === 0) {
          // First GMD rejection
          const updateSql = `UPDATE memos SET approved_by_gmd = -1 WHERE id = ?`;
          db.query(updateSql, [memoId], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ message: 'Error rejecting at GMD stage' });
            }
            return res.status(200).json({ message: 'Rejected by GMD', field: 'approved_by_gmd' });
          });
        } else if (memo.approved_by_gmd === 1 && memo.approved_by_finance === 1 && memo.approved_by_gmd2 === 0) {
          // GMD acting as GMD2 rejection
          const updateSql = `UPDATE memos SET approved_by_gmd2 = -1 WHERE id = ?`;
          db.query(updateSql, [memoId], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ message: 'Error rejecting at GMD2 stage' });
            }
            return res.status(200).json({ message: 'Rejected by GMD2', field: 'approved_by_gmd2' });
          });
        } else {
          return res.status(400).json({ message: 'GMD cannot reject at this stage or already acted' });
        }
      });
    } else {
      const { field, dependsOn } = roleApprovalMap[role];
      const checkSql = `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM memos WHERE id = ?`;
      db.query(checkSql, [memoId], (checkErr, checkResults) => {
        if (checkErr || checkResults.length === 0) {
          return res.status(404).json({ message: 'Memo not found' });
        }

        const memo = checkResults[0];

        if (memo[field] !== 0) {
          return res.status(400).json({ message: `Already acted on by ${role}` });
        }

        if (dependsOn && memo[dependsOn] !== 1) {
          return res.status(403).json({
            message: `Cannot reject yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
          });
        }

        const updateSql = `UPDATE memos SET ${field} = -1 WHERE id = ?`;
        db.query(updateSql, [memoId], (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: 'Error updating rejection status' });
          }
          return res.status(200).json({ message: `Rejected by ${role}`, field });
        });
      });
    }
  });
});


router.get('/memos/approval/:userId', (req, res) => {
    const userId = req.params.userId;

    const getUserRoleSql = 'SELECT role FROM users WHERE id = ?';
    db.query(getUserRoleSql, [userId], (err, userResults) => {
        if (err || userResults.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const role = userResults[0].role;

        let whereClause = '';
        switch (role) {
            case 'gmd':
                whereClause = 'approved_by_gmd = 0';
                break;
            case 'finance':
                whereClause = 'approved_by_gmd = 1 AND approved_by_finance = 0';
                break;
            case 'gmd2':
                whereClause = 'approved_by_finance = 1 AND approved_by_gmd2 = 0';
                break;
            case 'chairman':
                whereClause = 'approved_by_gmd2 = 1 AND approved_by_chairman = 0';
                break;
            default:
                return res.status(403).json({ message: 'User role not authorized to view memos for approval' });
        }

        const getMemosSql = `SELECT * FROM memos WHERE ${whereClause}`;
        db.query(getMemosSql, (memoErr, memoResults) => {
            if (memoErr) {
                return res.status(500).json({ message: 'Error fetching memos for approval' });
            }

            res.status(200).json(memoResults);
        });
    });
});


// router.get('/memos/for-approval', (req, res) => {
//     const userId = req.query.user_id;

//     if (!userId) {
//         return res.status(400).json({ message: 'user_id query parameter is required' });
//     }

//     const getUserRoleSql = 'SELECT role FROM users WHERE id = ?';
//     db.query(getUserRoleSql, [userId], (err, userResults) => {
//         if (err || userResults.length === 0) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const role = userResults[0].role;

//         let whereClause = '';
//         switch (role) {
//             case 'gmd':
//                 whereClause = 'approved_by_gmd = 0';
//                 break;
//             case 'finance':
//                 whereClause = 'approved_by_gmd = 1 AND approved_by_finance = 0';
//                 break;
//             case 'gmd2':
//                 whereClause = 'approved_by_finance = 1 AND approved_by_gmd2 = 0';
//                 break;
//             case 'chairman':
//                 whereClause = 'approved_by_gmd2 = 1 AND approved_by_chairman = 0';
//                 break;
//             default:
//                 return res.status(403).json({ message: 'User role not authorized to view memos for approval' });
//         }

//         const getMemosSql = `SELECT * FROM memos WHERE ${whereClause} ORDER BY created_at DESC`;
//         db.query(getMemosSql, (memoErr, memoResults) => {
//             if (memoErr) {
//                 return res.status(500).json({ message: 'Error fetching memos for approval' });
//             }

//             res.status(200).json(memoResults);
//         });
//     });
// });






module.exports = router;
