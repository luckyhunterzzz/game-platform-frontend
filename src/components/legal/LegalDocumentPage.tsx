'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n/i18n-context';

type LegalDocumentPageProps = {
  kind: 'privacy' | 'terms';
};

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalContent = {
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: LegalSection[];
};

function getContent(locale: 'ru' | 'en', kind: 'privacy' | 'terms'): LegalContent {
  if (locale === 'ru') {
    if (kind === 'privacy') {
      return {
        title: '\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438',
        subtitle:
          '\u041d\u0438\u0436\u0435 \u043e\u043f\u0438\u0441\u0430\u043d\u043e, \u043a\u0430\u043a GameOps Platform \u0441\u043e\u0431\u0438\u0440\u0430\u0435\u0442, \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442 \u0438 \u0445\u0440\u0430\u043d\u0438\u0442 \u0434\u0430\u043d\u043d\u044b\u0435 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439.',
        updatedAt: '\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435: 13.04.2026',
        sections: [
          {
            title: '\u041e\u0431\u0449\u0438\u0435 \u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u044f',
            paragraphs: [
              'GameOps Platform \u2014 \u044d\u0442\u043e \u043d\u0435\u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u0430\u043d-\u043f\u0440\u043e\u0435\u043a\u0442, \u0441\u043e\u0437\u0434\u0430\u043d\u043d\u044b\u0439 \u0434\u043b\u044f \u0438\u0433\u0440\u043e\u043a\u043e\u0432 Empires & Puzzles.',
              '\u041c\u044b \u0441\u0442\u0430\u0440\u0430\u0435\u043c\u0441\u044f \u0441\u043e\u0431\u0438\u0440\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0442\u0435 \u0434\u0430\u043d\u043d\u044b\u0435, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u043d\u0443\u0436\u043d\u044b \u0434\u043b\u044f \u0440\u0430\u0431\u043e\u0442\u044b \u0441\u0430\u0439\u0442\u0430, \u0432\u0445\u043e\u0434\u0430 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442 \u0438 \u0431\u0443\u0434\u0443\u0449\u0438\u0445 \u0444\u0443\u043d\u043a\u0446\u0438\u0439 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b.',
            ],
          },
          {
            title: '\u041a\u0430\u043a\u0438\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u043c\u044b \u043c\u043e\u0436\u0435\u043c \u0441\u043e\u0431\u0438\u0440\u0430\u0442\u044c',
            paragraphs: [
              '\u041f\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0438 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0438 \u0441\u0430\u0439\u0442\u0430 \u043c\u044b \u043c\u043e\u0436\u0435\u043c \u0445\u0440\u0430\u043d\u0438\u0442\u044c email, \u0434\u0430\u0442\u0443 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438, \u0442\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u0438 \u0438 \u044f\u0437\u044b\u043a \u0438\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430.',
              '\u0412 \u0431\u0443\u0434\u0443\u0449\u0435\u043c \u043c\u043e\u0433\u0443\u0442 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u0442\u0430\u043a\u0436\u0435 Telegram, VK, Discord, \u0438\u0433\u0440\u043e\u0432\u043e\u0439 \u043d\u0438\u043a, ID \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430 \u0438 \u0438\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435, \u0435\u0441\u043b\u0438 \u043e\u043d\u0438 \u0431\u0443\u0434\u0443\u0442 \u043d\u0443\u0436\u043d\u044b \u0434\u043b\u044f \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0445 \u0444\u0443\u043d\u043a\u0446\u0438\u0439.',
            ],
          },
          {
            title: '\u0414\u043b\u044f \u0447\u0435\u0433\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442\u0441\u044f \u0434\u0430\u043d\u043d\u044b\u0435',
            paragraphs: [
              '\u0414\u0430\u043d\u043d\u044b\u0435 \u043d\u0443\u0436\u043d\u044b \u0434\u043b\u044f \u0440\u0430\u0431\u043e\u0442\u044b \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430, \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f \u0434\u043e\u0441\u0442\u0443\u043f\u0430, \u0437\u0430\u0449\u0438\u0442\u044b \u043e\u0442 \u0437\u043b\u043e\u0443\u043f\u043e\u0442\u0440\u0435\u0431\u043b\u0435\u043d\u0438\u0439 \u0438 \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u044f \u0444\u0443\u043d\u043a\u0446\u0438\u0439 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b.',
              '\u0412 \u0431\u0443\u0434\u0443\u0449\u0435\u043c \u0447\u0430\u0441\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0445 \u043c\u043e\u0436\u0435\u0442 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u0434\u043b\u044f \u0440\u0443\u0447\u043d\u043e\u0439 \u0438\u043b\u0438 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u043e\u0446\u0435\u043d\u043a\u0438 \u043d\u0430\u0434\u0435\u0436\u043d\u043e\u0441\u0442\u0438 \u043f\u0440\u0438 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0438 \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0445 \u0441\u0435\u0440\u0432\u0438\u0441\u043e\u0432.',
            ],
          },
          {
            title: '\u0425\u0440\u0430\u043d\u0435\u043d\u0438\u0435 \u0438 \u0437\u0430\u0449\u0438\u0442\u0430',
            paragraphs: [
              '\u041c\u044b \u0441\u0442\u0430\u0440\u0430\u0435\u043c\u0441\u044f \u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435 \u0442\u043e\u043b\u044c\u043a\u043e \u0441\u0442\u043e\u043b\u044c\u043a\u043e, \u0441\u043a\u043e\u043b\u044c\u043a\u043e \u044d\u0442\u043e \u043d\u0443\u0436\u043d\u043e \u0434\u043b\u044f \u0440\u0430\u0431\u043e\u0442\u044b \u0441\u0430\u0439\u0442\u0430 \u0438 \u0435\u0433\u043e \u0437\u0430\u0449\u0438\u0442\u044b.',
              '\u0414\u043e\u0441\u0442\u0443\u043f \u043a \u0447\u0443\u0432\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u043c \u0434\u0430\u043d\u043d\u044b\u043c \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044f, \u0430 \u0442\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u043c\u0435\u0440\u044b \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u0438 \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u044e\u0442\u0441\u044f \u043f\u043e \u043c\u0435\u0440\u0435 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438.',
            ],
          },
          {
            title: '\u041f\u0440\u0430\u0432\u0430 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f',
            paragraphs: [
              '\u0412\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u0437\u0430\u043f\u0440\u043e\u0441\u0438\u0442\u044c \u0438\u0441\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u0443\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0441\u0432\u043e\u0438\u0445 \u0434\u0430\u043d\u043d\u044b\u0445, \u0435\u0441\u043b\u0438 \u044d\u0442\u043e \u043d\u0435 \u043f\u0440\u043e\u0442\u0438\u0432\u043e\u0440\u0435\u0447\u0438\u0442 \u0437\u0430\u043a\u043e\u043d\u0443 \u0438\u043b\u0438 \u0442\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u043c \u043e\u0431\u044f\u0437\u0430\u043d\u043d\u043e\u0441\u0442\u044f\u043c \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b.',
              '\u041f\u043e \u0432\u043e\u043f\u0440\u043e\u0441\u0430\u043c, \u0441\u0432\u044f\u0437\u0430\u043d\u043d\u044b\u043c \u0441 \u0434\u0430\u043d\u043d\u044b\u043c\u0438, \u043c\u043e\u0436\u043d\u043e \u043d\u0430\u043f\u0438\u0441\u0430\u0442\u044c \u0432 Telegram: @gameops_platform.',
            ],
          },
        ],
      };
    }

    return {
      title: '\u0423\u0441\u043b\u043e\u0432\u0438\u044f \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f',
      subtitle:
        '\u041d\u0438\u0436\u0435 \u043e\u043f\u0438\u0441\u0430\u043d\u044b \u0431\u0430\u0437\u043e\u0432\u044b\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f GameOps Platform.',
      updatedAt: '\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435: 13.04.2026',
      sections: [
        {
          title: '\u041e\u0431\u0449\u0438\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u0430',
          paragraphs: [
            'GameOps Platform \u2014 \u044d\u0442\u043e \u043d\u0435\u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u0430\u043d-\u043f\u0440\u043e\u0435\u043a\u0442 \u0434\u043b\u044f \u0438\u0433\u0440\u043e\u043a\u043e\u0432 Empires & Puzzles.',
            '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044f \u0441\u0430\u0439\u0442, \u0432\u044b \u0441\u043e\u0433\u043b\u0430\u0448\u0430\u0435\u0442\u0435\u0441\u044c \u0441 \u0442\u0435\u043c, \u0447\u0442\u043e \u0431\u0443\u0434\u0435\u0442\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0435\u0433\u043e \u0434\u043e\u0431\u0440\u043e\u0441\u043e\u0432\u0435\u0441\u0442\u043d\u043e \u0438 \u0431\u0435\u0437 \u0437\u043b\u043e\u0443\u043f\u043e\u0442\u0440\u0435\u0431\u043b\u0435\u043d\u0438\u0439.',
          ],
        },
        {
          title: '\u0410\u043a\u043a\u0430\u0443\u043d\u0442 \u0438 \u0434\u043e\u0441\u0442\u0443\u043f',
          paragraphs: [
            '\u0414\u043b\u044f \u043d\u0435\u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0444\u0443\u043d\u043a\u0446\u0438\u0439 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b \u043c\u043e\u0436\u0435\u0442 \u043f\u043e\u043d\u0430\u0434\u043e\u0431\u0438\u0442\u044c\u0441\u044f \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0438 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435 email.',
            '\u0412\u044b \u043d\u0435\u0441\u0435\u0442\u0435 \u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043d\u043d\u043e\u0441\u0442\u044c \u0437\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u043d\u043e\u0441\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0445 \u0434\u043b\u044f \u0432\u0445\u043e\u0434\u0430 \u0438 \u0437\u0430 \u0434\u043e\u0441\u0442\u043e\u0432\u0435\u0440\u043d\u043e\u0441\u0442\u044c \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u0438, \u043a\u043e\u0442\u043e\u0440\u0443\u044e \u0443\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442\u0435 \u0432 \u043f\u0440\u043e\u0444\u0438\u043b\u0435.',
          ],
        },
        {
          title: '\u041a\u043e\u043d\u0442\u0435\u043d\u0442 \u0438 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u0438',
          paragraphs: [
            '\u041d\u0430 \u0441\u0430\u0439\u0442\u0435 \u043c\u043e\u0433\u0443\u0442 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u0434\u0430\u043d\u043d\u044b\u0435, \u0438\u043b\u043b\u044e\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0438 \u043c\u043d\u0435\u043d\u0438\u044f \u0441 \u044f\u0432\u043d\u044b\u043c \u0443\u043a\u0430\u0437\u0430\u043d\u0438\u0435\u043c \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u0430 \u0438\u043b\u0438 \u0430\u0432\u0442\u043e\u0440\u0430.',
            '\u041c\u044b \u0441\u0442\u0430\u0440\u0430\u0435\u043c\u0441\u044f \u0443\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u0430\u0432\u0442\u043e\u0440\u0441\u0442\u0432\u043e \u0438 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u0438 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u043e. \u0415\u0441\u043b\u0438 \u0432\u044b \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0435, \u0447\u0442\u043e \u043a\u0430\u043a\u043e\u0439-\u043b\u0438\u0431\u043e \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b \u043d\u0443\u0436\u043d\u043e \u0438\u0441\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0438\u043b\u0438 \u0443\u0431\u0440\u0430\u0442\u044c, \u043d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u043d\u0430\u043c.',
          ],
        },
        {
          title: '\u041e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0435 \u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043d\u043d\u043e\u0441\u0442\u0438',
          paragraphs: [
            '\u0412\u0441\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u043d\u0430 \u0441\u0430\u0439\u0442\u0435 \u043f\u0440\u0435\u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0432 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u044b\u0445 \u0446\u0435\u043b\u044f\u0445 \u0438 \u0432 \u0432\u0438\u0434\u0435 \u00ab\u043a\u0430\u043a \u0435\u0441\u0442\u044c\u00bb.',
            '\u041c\u044b \u043d\u0435 \u0433\u0430\u0440\u0430\u043d\u0442\u0438\u0440\u0443\u0435\u043c \u0430\u0431\u0441\u043e\u043b\u044e\u0442\u043d\u0443\u044e \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u044c, \u043f\u043e\u043b\u043d\u043e\u0442\u0443 \u0438\u043b\u0438 \u043f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u0443\u044e \u0430\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u043e\u0432.',
          ],
        },
        {
          title: '\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u0443\u0441\u043b\u043e\u0432\u0438\u0439',
          paragraphs: [
            '\u041c\u044b \u043c\u043e\u0436\u0435\u043c \u043e\u0431\u043d\u043e\u0432\u043b\u044f\u0442\u044c \u044d\u0442\u0438 \u0443\u0441\u043b\u043e\u0432\u0438\u044f \u043f\u043e \u043c\u0435\u0440\u0435 \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u044f \u043f\u0440\u043e\u0435\u043a\u0442\u0430. \u041d\u043e\u0432\u0430\u044f \u0432\u0435\u0440\u0441\u0438\u044f \u0431\u0443\u0434\u0435\u0442 \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u0430 \u043d\u0430 \u044d\u0442\u043e\u0439 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0435.',
          ],
        },
      ],
    };
  }

  if (kind === 'privacy') {
    return {
      title: 'Privacy Policy',
      subtitle:
        'This page explains how GameOps Platform collects, uses and stores user-related information.',
      updatedAt: 'Last updated: 13 April 2026',
      sections: [
        {
          title: 'General information',
          paragraphs: [
            'GameOps Platform is an unofficial fan project created for Empires & Puzzles players.',
            'We try to collect only the information that is needed for account access, platform security and future platform features.',
          ],
        },
        {
          title: 'What data may be collected',
          paragraphs: [
            'When you register and use the site, we may store your email address, registration date, technical authentication data and interface language settings.',
            'In the future, the platform may also use Telegram, VK, Discord, game nickname, game account ID and other profile data if they become necessary for selected services.',
          ],
        },
        {
          title: 'Why we use this data',
          paragraphs: [
            'The data is used to provide account access, password recovery, basic security and future platform functionality.',
            'In the future, some profile and activity data may also be used for manual or automated trust evaluation for selected features.',
          ],
        },
        {
          title: 'Storage and protection',
          paragraphs: [
            'We try to keep user data only for as long as it is needed for platform operation, security and technical maintenance.',
            'Access to sensitive information is limited, and reasonable technical protection measures are applied whenever possible.',
          ],
        },
        {
          title: 'User rights',
          paragraphs: [
            'You may request correction or deletion of your data when it is technically and legally possible.',
            'For privacy-related questions, you can contact the project in Telegram: @gameops_platform.',
          ],
        },
      ],
    };
  }

  return {
    title: 'Terms of Use',
    subtitle: 'This page contains the basic rules for using GameOps Platform.',
    updatedAt: 'Last updated: 13 April 2026',
    sections: [
      {
        title: 'General rules',
        paragraphs: [
          'GameOps Platform is an unofficial fan project for Empires & Puzzles players.',
          'By using the site, you agree to use it in good faith and without abuse.',
        ],
      },
      {
        title: 'Account and access',
        paragraphs: [
          'Some platform features may require registration and verified email access.',
          'You are responsible for keeping your login credentials safe and for the accuracy of the information you provide in your profile.',
        ],
      },
      {
        title: 'Content and sources',
        paragraphs: [
          'The site may include data, illustrations and community opinions with explicit source or author attribution.',
          'If you believe some material should be corrected or removed, please contact the project.',
        ],
      },
      {
        title: 'Limitation of liability',
        paragraphs: [
          'All information on the site is provided for reference purposes and on an “as is” basis.',
          'We do not guarantee absolute accuracy, completeness or constant freshness of all materials.',
        ],
      },
      {
        title: 'Changes to the terms',
        paragraphs: [
          'These terms may be updated as the project grows. The latest version will always be published on this page.',
        ],
      },
    ],
  };
}

export default function LegalDocumentPage({ kind }: LegalDocumentPageProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { locale, messages } = useI18n();
  const content = getContent(locale, kind);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-64 border-r border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-xl font-bold text-cyan-400">{messages.home.menuTitle}</h2>

            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageOne}
                </Link>
              </li>
              <li>
                <Link
                  href="/heroes"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageTwo}
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex-1 bg-black/40 backdrop-blur-[1px]" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-14">
        <section className="w-full max-w-4xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-8">
          <div className="mb-8 border-b border-[var(--border)] pb-6">
            <div className="mb-3 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
              GameOps Platform
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
              {content.subtitle}
            </p>
            <div className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--foreground-soft)]">
              {content.updatedAt}
            </div>
          </div>

          <div className="space-y-5">
            {content.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">{section.title}</h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-7 text-[var(--foreground)]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
