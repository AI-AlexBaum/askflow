import { Product } from '../types';

export const products: Product[] = [
  {
    id: '2drive',
    name: '2drive',
    description: 'Het complete pakket voor rijinstructeurs en rijscholen.',
    categories: [
      {
        id: 'planning',
        title: 'Planning & Agenda',
        description: 'Beheer je lessen en instructeurs.',
        icon: 'Calendar',
        subcategories: [
          {
            id: 'agenda-beheer',
            title: 'Agenda Beheer',
            items: [
              {
                id: '1',
                question: 'Hoe voeg ik een nieuwe rijles toe?',
                answer: 'Klik in de agenda op het gewenste tijdstip. Kies de leerling en de instructeur. Sla de afspraak op om deze te bevestigen.',
              },
              {
                id: '2',
                question: 'Kan ik lessen automatisch herhalen?',
                answer: 'Ja, bij het aanmaken van een les kun je kiezen voor de optie "Herhalen". Je kunt hier de frequentie en einddatum instellen.',
              }
            ]
          },
          {
            id: 'instructeurs',
            title: 'Instructeurs',
            items: [
              {
                id: '3',
                question: 'Hoe koppel ik een instructeur aan een voertuig?',
                answer: 'Ga naar Instellingen > Instructeurs. Selecteer de instructeur en kies het standaard voertuig in het dropdown-menu.',
              }
            ]
          }
        ]
      },
      {
        id: 'facturatie',
        title: 'Facturatie',
        description: 'Facturen, pakketten en betalingen.',
        icon: 'CreditCard',
        items: [
          {
            id: '4',
            question: 'Hoe verstuur ik een factuur naar een leerling?',
            answer: 'Ga naar het profiel van de leerling, tabblad Facturen. Klik op "Nieuwe factuur" en selecteer de openstaande lessen of pakketten.',
          }
        ]
      }
    ]
  },
  {
    id: '2quote',
    name: '2quote',
    description: 'De slimme oplossing voor offertes en orderbeheer.',
    categories: [
      {
        id: 'offertes',
        title: 'Offertes',
        description: 'Maken en beheren van offertes.',
        icon: 'FileText',
        items: [
          {
            id: '5',
            question: 'Hoe maak ik een nieuwe offerte aan?',
            answer: 'Klik op de knop "Nieuwe Offerte" in het dashboard. Vul de klantgegevens en productregels in en klik op verzenden.',
          }
        ]
      },
      {
        id: 'klanten',
        title: 'Klantenbeheer',
        description: 'CRM en klantcontact.',
        icon: 'Users',
        items: [
          {
            id: '6',
            question: 'Kan ik klanten importeren uit Excel?',
            answer: 'Ja, ga naar Klanten > Import. Upload je .csv of .xlsx bestand en koppel de kolommen aan de juiste velden.',
          }
        ]
      }
    ]
  }
];
