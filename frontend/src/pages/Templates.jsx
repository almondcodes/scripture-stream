import { Palette, Plus, Copy, Edit, Trash2 } from 'lucide-react'

export default function Templates() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Palette className="h-8 w-8 text-primary-600 mr-3" />
              Templates
            </h1>
            <p className="mt-2 text-gray-600">
              Create and customize beautiful templates for displaying Bible verses.
            </p>
          </div>
          <button className="btn btn-primary btn-md">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Palette className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first template to customize how Bible verses appear in your streams.
          </p>
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Plus className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Create Template</p>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Copy className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Clone Existing</p>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Edit className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Customize Design</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
