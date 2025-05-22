import { useState } from 'react'
import { Link } from 'react-router-dom'

const MemoList = () => {
  const [memos, setMemos] = useState([
    {
      id: 1,
      title: 'Quarterly Meeting Schedule',
      sender: 'HR Department',
      date: '2023-06-15',
      status: 'unread',
      priority: 'high',
    },
    {
      id: 2,
      title: 'New Expense Policy',
      sender: 'Finance Department',
      date: '2023-06-10',
      status: 'read',
      priority: 'medium',
    },
    {
      id: 3,
      title: 'Office Renovation Notice',
      sender: 'Admin',
      date: '2023-06-05',
      status: 'read',
      priority: 'low',
    },
  ])

  const [selectedMemo, setSelectedMemo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMemos = memos.filter(memo =>
    memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    memo.sender.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMemoClick = (memo) => {
    setSelectedMemo(memo)
    // Mark as read
    setMemos(memos.map(m =>
      m.id === memo.id ? { ...m, status: 'read' } : m
    ))
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className={`${selectedMemo ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Memos</h2>
            <Link
              to="/memos/new"
              className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary"
            >
              New Memo
            </Link>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search memos..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredMemos.length > 0 ? (
              filteredMemos.map(memo => (
                <div
                  key={memo.id}
                  onClick={() => handleMemoClick(memo)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${memo.status === 'unread' ? 'border-l-4 border-l-primary' : ''} ${selectedMemo?.id === memo.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{memo.title}</h3>
                    {memo.priority === 'high' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        High
                      </span>
                    )}
                    {memo.priority === 'medium' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Medium
                      </span>
                    )}
                    {memo.priority === 'low' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Low
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{memo.sender}</p>
                  <p className="text-xs text-gray-400">{memo.date}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No memos found</p>
            )}
          </div>
        </div>
      </div>

      {selectedMemo && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedMemo.title}</h2>
                <p className="text-sm text-gray-500">From: {selectedMemo.sender}</p>
                <p className="text-xs text-gray-400">Date: {selectedMemo.date}</p>
              </div>
              <button
                onClick={() => setSelectedMemo(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose max-w-none">
              <p>Dear Team,</p>
              <p className="mt-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.
              </p>
              <p className="mt-4">
                Please review the attached documents and provide your feedback by the end of the week.
              </p>
              <p className="mt-4">
                Regards,

{selectedMemo.sender}
</p>
</div>
<div className="mt-6 border-t pt-4">
<h4 className="text-sm font-medium mb-2">Attachments</h4>
<div className="flex items-center space-x-2">
<div className="flex items-center p-2 border rounded-md">
<svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
</svg>
<span className="text-sm">document.pdf</span>
</div>
</div>
</div>
<div className="mt-6 flex justify-end space-x-3">
<button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
Forward
</button>
<button className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary">
Reply
</button>
</div>
</div>
</div>
)}
</div>
)
}

export default MemoList

