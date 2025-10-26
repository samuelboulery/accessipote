/**
 * Script Node.js pour extraire les ancres WCAG 2.1 depuis le site officiel français
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const url = 'https://www.w3.org/Translations/WCAG21-fr/';

async function scrapeWcagAnchors() {
  try {
    console.log('=== Script de scraping WCAG 2.1 ===\n');
    console.log('Téléchargement du contenu WCAG depuis:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('Contenu téléchargé, parsing en cours...\n');
    
    const mapping = {};
    
    // Chercher toutes les balises avec un id contenant un numéro de critère
    // Format possible: <hX id="nom-ancre">... X.Y.Z
    const patterns = [
      // Pattern pour <h2 id="..." etc
      /<h[2-4]\s+id="([^"]+)".*?>.*?(\d+\.\d+\.\d+)/gi,
      // Pattern pour <section id="..."
      /<section\s+id="([^"]+)".*?>.*?(\d+\.\d+\.\d+)/gi,
      // Pattern pour <div id="..."
      /<div\s+id="([^"]+)".*?>.*?(\d+\.\d+\.\d+)/gi,
    ];
    
    const foundIds = new Set();
    let count = 0;
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const anchor = match[1];
        const criteriaNumber = match[2];
        
        // Éviter les doublons
        if (!foundIds.has(criteriaNumber)) {
          mapping[criteriaNumber] = anchor;
          foundIds.add(criteriaNumber);
          count++;
          if (count <= 10 || count % 20 === 0) {
            console.log(`Trouvé: ${criteriaNumber} → ${anchor}`);
          }
        }
      }
    }
    
    // Si aucun résultat, essayer un autre approche: chercher tous les ids
    if (count === 0) {
      console.log('Première approche échouée, tentative alternative...');
      const idPattern = /<[^>]+id="([^"]+)"[^>]*>/g;
      const allIds = [];
      let idMatch;
      while ((idMatch = idPattern.exec(html)) !== null) {
        allIds.push(idMatch[1]);
      }
      console.log(`Trouvé ${allIds.length} IDs dans le document`);
      console.log('Premiers IDs:', allIds.slice(0, 10));
      
      // Chercher les IDs qui correspondent à des ancres WCAG
      const wcagPattern = /(\d+\.\d+\.\d+)/g;
      let numMatch;
      while ((numMatch = wcagPattern.exec(html)) !== null) {
        const criteriaNumber = numMatch[0];
        // Chercher l'ID le plus proche avant ce numéro
        const context = html.substring(Math.max(0, numMatch.index - 500), numMatch.index);
        const nearIdMatch = context.match(/id="([^"]+)"/);
        if (nearIdMatch) {
          const anchor = nearIdMatch[1];
          // Exclure les notes (h-note-*, notes-*, etc.) et les IDs numériques purs
          const isNote = anchor.toLowerCase().includes('note') || 
                        anchor.toLowerCase().includes('respec') ||
                        /^\d+$/.test(anchor) ||
                        anchor.toLowerCase().includes('general-ed');
          
          if (!isNote && !foundIds.has(criteriaNumber)) {
            mapping[criteriaNumber] = anchor;
            foundIds.add(criteriaNumber);
            count++;
            if (count <= 10 || count % 20 === 0) {
              console.log(`Trouvé: ${criteriaNumber} → ${anchor}`);
            }
          }
        }
      }
    }
    
    console.log(`\nTotal de ${Object.keys(mapping).length} correspondances trouvées\n`);
    
    // Sauvegarder dans le fichier
    const outputPath = join(process.cwd(), 'src/data/wcag-anchors.json');
    writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf-8');
    
    console.log(`✓ Fichier sauvegardé: ${outputPath}`);
    console.log(`✓ ${Object.keys(mapping).length} correspondances enregistrées\n`);
    
  } catch (error) {
    console.error('Échec du scraping:', error);
    process.exit(1);
  }
}

scrapeWcagAnchors();

