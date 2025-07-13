import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [telegramId, setTelegramId] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [isLoading, setIsLoading] = useState(false)
  const { login, verifyCode } = useAuth()

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telegramId.trim()) {
      toast.error('Por favor ingresa tu ID de Telegram')
      return
    }

    setIsLoading(true)
    try {
      await login(telegramId.trim())
      setStep('verify')
      toast.success('Código enviado a Telegram')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al solicitar acceso')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationCode.trim()) {
      toast.error('Por favor ingresa el código de verificación')
      return
    }

    setIsLoading(true)
    try {
      await verifyCode(verificationCode.trim())
      toast.success('¡Acceso concedido!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Static CMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Panel de Administración
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'request' ? (
            <form className="space-y-6" onSubmit={handleRequestAccess}>
              <div>
                <label htmlFor="telegram-id" className="block text-sm font-medium text-gray-700">
                  ID de Telegram
                </label>
                <div className="mt-1">
                  <input
                    id="telegram-id"
                    name="telegram-id"
                    type="text"
                    required
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className="input"
                    placeholder="Ej: 123456789"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Ingresa tu ID de Telegram para recibir un código de acceso
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg w-full"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Solicitar Acceso
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyCode}>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Código enviado
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Revisa tu Telegram y ingresa el código de verificación
                </p>
              </div>

              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                  Código de Verificación
                </label>
                <div className="mt-1">
                  <input
                    id="verification-code"
                    name="verification-code"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="input"
                    placeholder="Ej: 123456"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="btn btn-outline flex-1"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Verificar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  ¿Necesitas ayuda?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      ¿Cómo obtener tu ID de Telegram?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>1. Abre Telegram y busca @userinfobot</p>
                      <p>2. Envía cualquier mensaje al bot</p>
                      <p>3. El bot te responderá con tu ID</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 