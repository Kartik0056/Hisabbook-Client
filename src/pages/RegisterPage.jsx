import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Lock, Mail, User as UserIcon, Phone, ArrowRight, Loader2, Globe } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [initialProjectName, setInitialProjectName] = useState('');
  const [projectType, setProjectType] = useState('construction');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await register({
        name,
        email,
        phone,
        password,
        initialProjectName,
        projectType,
      });
      navigate('/');
    } catch (err) {
      setError(
        err.message ||
          (language === 'hi' ? 'खाता बनाने में त्रुटि हुई।' : 'Registration failed.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-blue-400 hover:text-blue-600 transition"
        >
          <Globe className="h-3.5 w-3.5 text-blue-600" />
          <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-3">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          {t('createFreeAccount')}
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {t('registerSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-slate-200/80 bg-white px-6 py-8 shadow-xl shadow-slate-200/50 sm:px-10">
          {error && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('fullName')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t('emailAddress')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t('phoneOptional')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('firstProjectName')}
              </label>
              <input
                type="text"
                placeholder={t('projectPlaceholder')}
                value={initialProjectName}
                onChange={(e) => setInitialProjectName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('projectCategory')}
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none font-medium"
              >
                <option value="construction">{language === 'hi' ? 'मकान निर्माण' : 'House Construction'}</option>
                <option value="renovation">{language === 'hi' ? 'मरम्मत व नवीनीकरण' : 'Home Renovation'}</option>
                <option value="personal">{language === 'hi' ? 'घरेलू खर्च' : 'Personal / Household'}</option>
                <option value="shop">{language === 'hi' ? 'दुकान / व्यापार' : 'Shop / Small Business'}</option>
                <option value="office">{language === 'hi' ? 'दफ्तर / कमर्शियल' : 'Office / Commercial'}</option>
                <option value="event">{language === 'hi' ? 'समारोह / कार्यक्रम' : 'Event / Ceremony'}</option>
                <option value="custom">{language === 'hi' ? 'अन्य प्रोजेक्ट' : 'Custom Project'}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 active:scale-98 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{t('createAccountBtn')}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              {t('signInBtn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
