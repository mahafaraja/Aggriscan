export type TreatmentGuide = {
  diseaseLabel: string;
  title: string;
  scientificName?: string;
  description: string;
  treatment: string[];
  prevention: string[];
  source: 'local';
};

const guides: Record<string, TreatmentGuide> = {
  Cassava_CMD: {
    diseaseLabel: 'Cassava_CMD',
    title: 'Cassava Mosaic Disease',
    scientificName: 'Cassava mosaic begomoviruses',
    description:
      'Cassava Mosaic Disease causes leaf mosaic patterns, distortion, stunting, and reduced root yield. It spreads mainly through infected cuttings and whiteflies.',
    treatment: [
      'Rogue and destroy visibly infected plants early.',
      'Do not reuse cuttings from symptomatic plants.',
      'Control whitefly pressure with clean field hygiene and recommended local extension practices.',
      'Plant resistant or tolerant cassava varieties when available.',
    ],
    prevention: [
      'Use certified disease-free cassava cuttings.',
      'Inspect fields regularly, especially young plants.',
      'Separate new plantings from heavily infected fields.',
      'Remove volunteer cassava plants that can host infection.',
    ],
    source: 'local',
  },
  Banana_BBW: {
    diseaseLabel: 'Banana_BBW',
    title: 'Banana Bacterial Wilt',
    scientificName: 'Xanthomonas vasicola pv. musacearum',
    description:
      'Banana Bacterial Wilt causes yellowing, wilting, premature fruit ripening, and bacterial ooze. It spreads through infected tools, insects, and planting material.',
    treatment: [
      'Cut and remove infected mats according to local extension guidance.',
      'Sterilize knives and farm tools after each plant contact.',
      'Remove male buds using a forked stick where recommended.',
      'Do not move infected suckers or plant material to other fields.',
    ],
    prevention: [
      'Use clean planting material from trusted sources.',
      'Disinfect tools between plants and blocks.',
      'Monitor bunches for premature ripening and leaf wilt.',
      'Report suspected outbreaks to extension officers quickly.',
    ],
    source: 'local',
  },
  Cassava_Healthy: {
    diseaseLabel: 'Cassava_Healthy',
    title: 'Healthy Cassava',
    description:
      'The scan did not detect visible disease signs. Keep monitoring because early infections may be subtle.',
    treatment: [
      'No treatment is needed from this scan result.',
      'Keep the plant under routine observation.',
    ],
    prevention: [
      'Use clean cuttings for future planting.',
      'Inspect leaves weekly for mosaic, curling, or stunting.',
      'Keep weeds and volunteer cassava controlled.',
    ],
    source: 'local',
  },
  Banana_Healthy: {
    diseaseLabel: 'Banana_Healthy',
    title: 'Healthy Banana',
    description:
      'The scan did not detect visible disease signs. Continue monitoring leaves, stems, and bunches.',
    treatment: [
      'No treatment is needed from this scan result.',
      'Keep the mat clean and monitor new symptoms.',
    ],
    prevention: [
      'Use clean suckers from trusted sources.',
      'Sterilize cutting tools during routine field work.',
      'Remove plant debris that could harbor pests or disease.',
    ],
    source: 'local',
  },
};

export function getTreatmentGuide(diseaseLabel: string): TreatmentGuide {
  return (
    guides[diseaseLabel] ?? {
      diseaseLabel,
      title: diseaseLabel.replace(/_/g, ' '),
      description:
        'The model returned this disease label, but no local treatment guide has been mapped yet.',
      treatment: ['Ask an agricultural extension officer to confirm the field diagnosis.'],
      prevention: ['Keep the affected plant isolated from new planting material until confirmed.'],
      source: 'local',
    }
  );
}
