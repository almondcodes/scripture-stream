import { User, Settings, Key, Trash2, Save } from 'lucide-react'

export default function Profile() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <User className="h-8 w-8 text-primary-600 mr-3" />
          Profile Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Profile Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page will include user profile editing, password changes, and account management.
          </p>
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Settings className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Edit Profile</p>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Key className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Change Password</p>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Trash2 className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Delete Account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
