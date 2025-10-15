import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { useForm } from 'react-hook-form';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { Turnstile } from '@marsidev/react-turnstile';

type LoginFormInputs = {
    email: string;
    password: string;
};

const Login = () => {
    const navigate = useNavigate();
    const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaError, setCaptchaError] = useState<string>('');

    const onSubmit = async ({ email, password }: LoginFormInputs) => {
        // Check if captcha is completed
        if (!captchaToken) {
            setCaptchaError('Please complete the verification');
            return;
        }

        setCaptchaError('');

        try {
            await signInWithEmailAndPassword(email, password);
            // Navigation is handled by PrivateRoute
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    // Redirect if already logged in
    if (user) {
        navigate('/');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
                {/* Logo or App Name */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Driver Events</h1>
                    <p className="text-gray-500 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            })}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="you@example.com"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters'
                                }
                            })}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                                errors.password ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Cloudflare Turnstile */}
                    <div className="flex justify-center">
                        <Turnstile
                            siteKey="0x4AAAAAAB6rOC9J6qtcrxNl"
                            onSuccess={(token) => {
                                setCaptchaToken(token);
                                setCaptchaError('');
                            }}
                            onError={() => {
                                setCaptchaToken(null);
                                setCaptchaError('Verification failed. Please try again.');
                            }}
                            onExpire={() => {
                                setCaptchaToken(null);
                                setCaptchaError('Verification expired. Please verify again.');
                            }}
                            options={{
                                theme: 'light',
                                size: 'normal',
                            }}
                        />
                    </div>
                    {captchaError && (
                        <p className="text-sm text-red-600 text-center">{captchaError}</p>
                    )}

                    {/* Firebase Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600 text-center">
                                {error.message}
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !captchaToken}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-200 ${
                            loading || !captchaToken
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Protected by Cloudflare Turnstile
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;