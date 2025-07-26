import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiPlus, FiTrash2, FiFile, FiX, FiArrowLeft } from 'react-icons/fi'

const NewRequisition = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth() 
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
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
  e.preventDefault();
  setLoading(true);
  setError('');

  // Validate required fields
  if (!formData.title || !formData.description) {
    setError('Please fill all required fields');
    setLoading(false);
    return;
  }

  if (formData.items.length === 0) {
    setError('Please add at least one item');
    setLoading(false);
    return;
  }

  if (formData.items.some(item => !item.name || !item.quantity || !item.unitPrice)) {
    setError('Please fill all item fields (name, quantity, and price)');
    setLoading(false);
    return;
  }

  // Add null check for user
  if (!user) {
    setError('You must be logged in to create a requisition');
    setLoading(false);
    return;
  }

  try {
    const formDataToSend = new FormData();
    
    // Append basic fields
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('created_by', user.id.toString()); // Use the user from component scope
    
    // Append items
    const firstItem = formData.items[0];
    formDataToSend.append('items', firstItem.name);
    formDataToSend.append('quantity', firstItem.quantity.toString());
    formDataToSend.append('unit_price', firstItem.unitPrice.toString());
    
    // Append file
    if (formData.attachments.length > 0) {
      formDataToSend.append('attachment', formData.attachments[0]);
    }

    const response = await fetch(`${BASE_URL}/requisitions`, {
      method: 'POST',
      body: formDataToSend,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create requisition');
    }

    const result = await response.json();
    window.alert(`Requisition created successfully! ID: ${result.requisitionId}`);
    navigate('/dashboard/requisitions');
  } catch (err) {
    setError(err.message || 'Failed to create requisition');
    console.error('Submission error:', err);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/requisitions')}
            className="flex items-center text-white hover:text-gray-200 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Requisitions
          </button>
          <h2 className="text-xl font-semibold text-white">Create New Requisition</h2>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiX className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <FiPlus className="mr-1" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-md border border-gray-200">
                  <div className="col-span-5">
                    <label htmlFor={`item-name-${index}`} className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                    <input
                      type="text"
                      id={`item-name-${index}`}
                      name="name"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-colors"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor={`item-quantity-${index}`} className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      id={`item-quantity-${index}`}
                      name="quantity"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-colors"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <label htmlFor={`item-unitPrice-${index}`} className="block text-xs font-medium text-gray-700 mb-1">Unit Price (₦)</label>
                    <input
                      type="number"
                      id={`item-unitPrice-${index}`}
                      name="unitPrice"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-colors"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                    <div className="px-3 py-2 text-sm font-medium bg-gray-50 rounded">
                      ₦{(item.quantity * (Number(item.unitPrice) || 0)).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                        title="Remove item"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="mt-6 p-3 bg-white border border-gray-200 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                <span className="text-lg font-bold text-primary">₦{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>
            
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white">
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
                <div className="flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
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
              <div className="mt-4 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-white">
                    <div className="flex items-center">
                      <FiFile className="h-5 w-5 text-gray-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove file"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard/requisitions')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Submit Requisition'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewRequisition