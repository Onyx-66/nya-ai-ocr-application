import { useAuth } from '@/lib/AuthContext';
import { Cloud, Palette, Type, ListChecks, UserCircle, Sliders, Layers, Check, Server } from 'lucide-react';
import { useTheme, THEMES, FONTS } from '@/lib/ThemeContext';
import { useI18n } from '@/lib/I18nContext';
import SettingsSection from '@/components/SettingsSection';
import MarkerSettings from '@/components/batch/MarkerSettings';
import DefaultSettings from '@/components/batch/DefaultSettings';
import DriveConnection from '@/components/batch/DriveConnection';
import ExportTemplateManager from '@/components/batch/ExportTemplateManager';
import MobileSelect from '@/components/ui/MobileSelect';
import AccountSection from '@/components/batch/AccountSection';
import AdminPanel from '@/components/batch/AdminPanel';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LocalServerSection from '@/components/batch/LocalServerSection';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, fontFamily, setFontFamily, fontScale, setFontScale } = useTheme();
  const { t } = useI18n();
  const { toast } = useToast();

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold mb-1 text-[hsl(var(--c-text))]">{t('settings.title')}</h1>
      <p className="text-[hsl(var(--c-dim))] text-sm mb-6">{t('settings.subtitle')}</p>

      <div className="space-y-4">
        {/* App language — first so users find it easily */}
        <SettingsSection icon={ListChecks} title={t('settings.appLanguage')} subtitle={t('settings.subtitle')} defaultOpen>
          <LanguageSwitcher />
        </SettingsSection>

        <SettingsSection icon={UserCircle} title={t('settings.account')} subtitle={t('settings.accountSubtitle')} defaultOpen>
          <AccountSection />
        </SettingsSection>

        <SettingsSection icon={Palette} title={t('settings.appearance')} subtitle={t('settings.appearanceSubtitle')}>
          <label className="block text-xs text-[hsl(var(--c-dim))] mb-2">{t('settings.theme')}</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors ${theme === th.id ? 'border-[hsl(var(--c-accent))] bg-[hsl(var(--c-soft))]' : 'border-[hsl(var(--c-border))] hover:bg-[hsl(var(--c-soft))]'}`}
              >
                <span className="w-6 h-6 rounded-full" style={{ background: th.swatch }} />
                <span className="text-[11px] text-[hsl(var(--c-text-soft))]">{th.name}</span>
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] mb-1.5"><Type className="w-3.5 h-3.5" /> {t('settings.fontFamily')}</label>
              <MobileSelect value={fontFamily} onChange={setFontFamily} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} placeholder={t('settings.fontFamily')} className="bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]" />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--c-dim))] mb-1.5 block">{t('settings.fontSize')} · {Math.round(fontScale * 100)}%</label>
              <input type="range" min={0.85} max={1.3} step={0.05} value={fontScale} onChange={(e) => setFontScale(Number(e.target.value))} className="w-full accent-[hsl(var(--c-accent))]" />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection icon={Layers} title={t('settings.exportTemplates')} subtitle={t('settings.exportSubtitle')}>
          <ExportTemplateManager />
        </SettingsSection>

        <SettingsSection icon={Sliders} title={t('settings.workspaceDefaults')} subtitle={t('settings.defaultsSubtitle')}>
          <DefaultSettings />
        </SettingsSection>

        <SettingsSection icon={ListChecks} title={t('settings.ocrSigns')} subtitle={t('settings.signsSubtitle')}>
          <MarkerSettings />
        </SettingsSection>

        <SettingsSection icon={Cloud} title={t('settings.googleDrive')} subtitle={t('settings.driveSubtitle')}>
          <DriveConnection />
        </SettingsSection>

        <SettingsSection icon={Server} title={t('settings.localServer')} subtitle={t('settings.localServerSubtitle')}>
          <LocalServerSection />
        </SettingsSection>

        {user?.role === 'admin' && (
          <SettingsSection icon={ListChecks} title={t('settings.admin')} subtitle={t('settings.adminSubtitle')} defaultOpen>
            <AdminPanel />
          </SettingsSection>
        )}
      </div>

      <button
        onClick={() => toast({ title: t('common.saved'), description: t('common.savedDesc') })}
        className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-3 text-sm font-medium mt-6"
      >
        <Check className="w-4 h-4" /> {t('common.saveChanges')}
      </button>
    </div>
  );
}