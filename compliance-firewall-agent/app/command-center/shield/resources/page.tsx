"use client";

import { motion } from "framer-motion";
import {
  ExternalLink,
  BookOpen,
  Download,
  Shield,
  FileText,
  Gavel,
  Globe,
  Building2,
  Users,
} from "lucide-react";

const RESOURCES = [
  {
    category: "Official CMMC Documentation",
    items: [
      { title: "NIST SP 800-171 Rev 2", description: "Full 110-control security requirements document", url: "https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final", icon: FileText },
      { title: "CMMC Model v2.0", description: "Official Cybersecurity Maturity Model Certification framework", url: "https://dodcio.defense.gov/CMMC/", icon: Shield },
      { title: "DFARS 252.204-7012", description: "Safeguarding Covered Defense Information clause", url: "https://www.acquisition.gov/dfars/252.204-7012", icon: Gavel },
      { title: "SPRS Portal", description: "Submit your official SPRS score to the DoD", url: "https://www.sprs.csd.disa.mil/", icon: Globe },
    ],
  },
  {
    category: "Assessment Tools",
    items: [
      { title: "NIST SP 800-171A", description: "Assessment procedures for each control (how C3PAOs evaluate)", url: "https://csrc.nist.gov/publications/detail/sp/800-171a/final", icon: FileText },
      { title: "DoD Assessment Methodology v1.2.1", description: "Official scoring methodology used for SPRS", url: "https://www.acq.osd.mil/asda/dpc/cp/cyber/safeguarding.html", icon: Download },
      { title: "CUI Registry", description: "Understand what qualifies as Controlled Unclassified Information", url: "https://www.archives.gov/cui", icon: Building2 },
    ],
  },
  {
    category: "Budget-Friendly Implementation Tools",
    items: [
      { title: "Microsoft 365 GCC", description: "FedRAMP-authorized cloud suite for defense contractors ($12/user/mo)", url: "https://www.microsoft.com/en-us/microsoft-365/government", icon: Shield },
      { title: "CIS Benchmarks", description: "Free security configuration guides for OS and applications", url: "https://www.cisecurity.org/cis-benchmarks", icon: Download },
      { title: "Wazuh SIEM", description: "Free open-source security monitoring and log management", url: "https://wazuh.com/", icon: Shield },
      { title: "Vanta / Drata", description: "Automated compliance monitoring platforms", url: "https://vanta.com/", icon: FileText },
    ],
  },
  {
    category: "Training & Community",
    items: [
      { title: "Cybersecurity & Infrastructure Security Agency (CISA)", description: "Free cybersecurity training and threat intelligence", url: "https://www.cisa.gov/cybersecurity-training-exercises", icon: Users },
      { title: "CMMC-AB Marketplace", description: "Find certified C3PAO assessors and consultants", url: "https://cyberab.org/Marketplace", icon: Users },
      { title: "NIST Manufacturing Extension Partnership", description: "Free or subsidized cybersecurity assessments for small manufacturers", url: "https://www.nist.gov/mep", icon: Building2 },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Resources</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Official references, implementation tools, and community resources for CMMC compliance.
        </p>
      </div>

      <div className="space-y-8">
        {RESOURCES.map((section, si) => (
          <motion.div
            key={section.category}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1 }}
          >
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-400" />
              {section.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-slate-50/70 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={18} className="text-slate-600 dark:text-slate-400 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-slate-900 font-medium text-sm group-hover:text-blue-300 transition-colors">
                            {item.title}
                          </h3>
                          <ExternalLink size={12} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">{item.description}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
