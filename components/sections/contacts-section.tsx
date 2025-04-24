"use client";

import React, { useState } from "react";
import { 
  IconMail, 
  IconBrandTelegram, 
  IconPhone, 
  IconBrandLinkedin, 
  IconSend, 
  IconUser, 
  IconMessage, 
  IconBrandFacebook, 
  IconBrandInstagram, 
  IconBrandGithub, 
  IconMapPin, 
  IconChess,
  IconBrandWhatsapp,
  IconBrandDiscord,
  IconDeviceGamepad2
} from "@tabler/icons-react";

import { useTranslation } from "@/lib/hooks/useTranslation";
import { TranslationKey } from "@/lib/translations";

export function ContactsSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    
    console.log("Спроба відправлення форми");
    
    try {
      // Відправляємо дані на API ендпоінт
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      console.log("Відповідь від сервера:", data);
      
      if (!response.ok) {
        const errorText = data.details || data.error || t('contacts.error.default' as TranslationKey);

        throw new Error(errorText);
      }
      
      // Очищаємо форму після успішного надсилання
      setName("");
      setEmail("");
      setMessage("");
      setSubmitSuccess(true);
      
      // Скидаємо повідомлення про успіх через 5 секунд
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Детальна помилка відправки:', error);
      setErrorMessage(error instanceof Error ? error.message : t('contacts.error.unknown' as TranslationKey));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center" id="contacts">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-center justify-center mb-8">
          <IconMail className="w-8 h-8 mr-2 text-amber-500" />
          <h2 className="text-4xl font-bold">{t('contacts.title' as TranslationKey)}</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Форма контактів */}
          <div className="p-6 bg-white/5 dark:bg-gray-800/30 backdrop-blur-md rounded-lg">
            <h3 className="text-2xl font-semibold mb-5">{t('contacts.lets.connect' as TranslationKey)}</h3>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="name">{t('contacts.form.name' as TranslationKey)}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <IconUser size={18} />
                  </span>
                  <input
                    required
                    className="w-full py-2 pl-10 pr-3 bg-white/10 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    id="name"
                    placeholder={t('contacts.form.name.placeholder' as TranslationKey)}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">{t('contacts.form.email' as TranslationKey)}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <IconMail size={18} />
                  </span>
                  <input
                    required
                    className="w-full py-2 pl-10 pr-3 bg-white/10 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    id="email"
                    placeholder="example@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="message">{t('contacts.form.message' as TranslationKey)}</label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-gray-400">
                    <IconMessage size={18} />
                  </span>
                  <textarea
                    required
                    className="w-full py-2 pl-10 pr-3 bg-white/10 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[120px]"
                    id="message"
                    placeholder={t('contacts.form.message.placeholder' as TranslationKey)}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </div>
              
              <button
                className="w-full flex items-center justify-center py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition-colors disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <span>{t('contacts.form.sending' as TranslationKey)}</span>
                ) : (
                  <>
                    <IconSend className="mr-2 h-5 w-5" />
                    <span>{t('contacts.form.send' as TranslationKey)}</span>
                  </>
                )}
              </button>
              
              {submitSuccess && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-md text-green-300">
                  {t('contacts.form.success' as TranslationKey)}
                </div>
              )}
              
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-300">
                  {t('contacts.form.error' as TranslationKey)}: {errorMessage}
                </div>
              )}
            </form>
          </div>
          
          {/* Блок з контактами */}
          <div>
            <div className="p-6 bg-white/5 dark:bg-gray-800/30 backdrop-blur-md rounded-lg mb-6">
              <h3 className="text-2xl font-semibold mb-4">{t('contacts.my.contacts' as TranslationKey)}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <IconMail className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">Email</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="mailto:yura.martin@icloud.com">
                      yura.martin@icloud.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconBrandTelegram className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">Telegram</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://t.me/gay_control" rel="noopener noreferrer" target="_blank">
                      @gay_control
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconPhone className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">{t('contacts.phone' as TranslationKey)}</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="tel:+380509525558">
                      +380 50 952 55 58
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconBrandWhatsapp className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">WhatsApp</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://wa.me/380509525558" rel="noopener noreferrer" target="_blank">
                      +380 50 952 55 58
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconPhone className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">Viber</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="viber://chat?number=%2B380509525558">
                      +380 50 952 55 58
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconBrandDiscord className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">Discord</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://discord.com/users/yuriimartyniuk03" rel="noopener noreferrer" target="_blank">
                      yuriimartyniuk03
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconBrandLinkedin className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">LinkedIn</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://www.linkedin.com/in/yurii-martyniuk-488a72326/" rel="noopener noreferrer" target="_blank">
                      yurii-martyniuk
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconBrandFacebook className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">Facebook</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://www.facebook.com/yuriimartyniukofficial" rel="noopener noreferrer" target="_blank">
                      yuriimartyniukofficial
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconBrandInstagram className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">Instagram</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://www.instagram.com/georg6262" rel="noopener noreferrer" target="_blank">
                      @georg6262
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconMessage className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">MS Teams</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://teams.microsoft.com/l/chat/0/0?users=yura.martin@icloud.com" rel="noopener noreferrer" target="_blank">
                      yura.martin.1993@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconBrandGithub className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">GitHub</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://github.com/martyniukyurii" rel="noopener noreferrer" target="_blank">
                      martyniukyurii
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconChess className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">Chess.com</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://www.chess.com/member/lilkakish" rel="noopener noreferrer" target="_blank">
                      lilkakish
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconDeviceGamepad2 className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">Clash Royale</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://link.clashroyale.com/?supercell_id&p=93-534ff246-3409-423c-9804-badc8a29f14d" rel="noopener noreferrer" target="_blank">
                      YuraMartyn #GJ2Y289R
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <IconMapPin className="w-5 h-5 mr-2 text-amber-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium">{t('contacts.address' as TranslationKey)}</h4>
                    <a className="text-blue-400 hover:underline text-sm" href="https://maps.app.goo.gl/TuR3p21qDL1Ud7GDA" rel="noopener noreferrer" target="_blank">
                      м. Чернівці, вул. Головна 265а
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Блок з гумором */}
            <div className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-lg">
              <h3 className="text-xl font-semibold mb-3">{t('contacts.alternative.ways' as TranslationKey)}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>{t('contacts.pigeon.post' as TranslationKey)}:</strong> {t('contacts.pigeon.post.address' as TranslationKey)}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>{t('contacts.trembita' as TranslationKey)}:</strong> {t('contacts.trembita.details' as TranslationKey)}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>OnlyFans:</strong> {t('contacts.onlyfans' as TranslationKey)}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>{t('contacts.jungle.drums' as TranslationKey)}:</strong> {t('contacts.jungle.drums.details' as TranslationKey)}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>{t('contacts.bottle.mail' as TranslationKey)}:</strong> {t('contacts.bottle.mail.details' as TranslationKey)}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>{t('contacts.telepathy' as TranslationKey)}:</strong> {t('contacts.telepathy.details' as TranslationKey)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 