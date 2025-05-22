import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NewRequisition = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    amount: '',
    description: '',
    items: [{ name: '', quantity: 1, unitPrice: '' }],
    attachments: []
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index, e) => {
    const { name, value } = e.target
    const newItems = [...formData.items]
    newItems[index] = {
      ...newItems[index],
      [name]: name === 'quantity' || name === 'unitPrice' ? Number(value) : value
    }
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
  }

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unitPrice: '' }]
    }))
  }

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = [...formData.items]
      newItems.splice(index, 1)
      setFormData(prev => ({
        ...prev,
        items: newItems
      }))
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const handleRemoveAttachment = (index) => {
    setFormData(prev => {
      const newAttachments = [...prev.attachments]
      newAttachments.splice(index, 1)
      return {
        ...prev,
        attachments: newAttachments
      }
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * (Number(item.unitPrice) || 0))
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.title || !formData.department || !formData.description || formData.items.some(item => !item.name || !item.unitPrice)) {
      setError('Please fill all required fields')
      setLoading(false)
      return
    }

    try {
      // TODO: API call to create requisition
      // For now, simulate creation
      setTimeout(() => {
        navigate('/requisitions')
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to create requisition')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Create New Requisition</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Select Department</option>
              <option value="hr">Human Resources</option>
              <option value="finance">Finance</option>
              <option value="operations">Operations</option>
              <option value="it">IT</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Items <span className="text-red-500">*</span></h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-sm text-primary hover:text-primary"
            >
              + Add Item
            </button>
          </div>
          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <label htmlFor={`item-name-${index}`} className="block text-xs text-gray-500 mb-1">Item Name</label>
                  <input
                    type="text"
                    id={`item-name-${index}`}
                    name="name"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor={`item-quantity-${index}`} className="block text-xs text-gray-500 mb-1">Qty</label>
                  <input
                    type="number"
                    id={`item-quantity-${index}`}
                    name="quantity"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label htmlFor={`item-unitPrice-${index}`} className="block text-xs text-gray-500 mb-1">Unit Price</label>
                  <input
                    type="number"
                    id={`item-unitPrice-${index}`}
                    name="unitPrice"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Total</label>
                  <div className="px-3 py-2 text-sm">
                    ${(item.quantity * (Number(item.unitPrice) || 0)).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Amount:</span>
            <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supporting Documents
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary focus-within:outline-none"
                >
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, DOC, XLS up to 10MB</p>
            </div>
          </div>
          {formData.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/requisitions')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Submitting...' : 'Submit Requisition'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewRequisition