import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

// Input text standard
export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

// Textarea standard
export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

// Select standard
export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

// Label standard
export function Label({ className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-sm font-medium text-gray-300 mb-2 ${className}`}
      {...props}
    />
  );
}

// Helper text
export function HelperText({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`mt-1 text-sm text-gray-400 ${className}`}
      {...props}
    />
  );
}

// Form container
export function FormCard({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}
      {...props}
    />
  );
}

// Error message
export function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
      <p className="text-red-400 text-sm">{children}</p>
    </div>
  );
}

// Success message
export function SuccessMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg">
      <p className="text-green-400 text-sm">{children}</p>
    </div>
  );
}

// Primary button
export function PrimaryButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    />
  );
}

// Secondary button
export function SecondaryButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors ${className}`}
      {...props}
    />
  );
}
