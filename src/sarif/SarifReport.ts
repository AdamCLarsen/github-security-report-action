import CodeScanningRule from "./CodeScanningRule";
import {SarifReportData, SarifRule} from './SarifDataTypes';

export default class SarifReport {

  private readonly data: SarifReportData;

  readonly rules: CodeScanningRule[];

  constructor(data: SarifReportData) {
    this.data = data;
    this.rules = getRules(data) || [];
  }

  get cweList(): string[] {
    const result = this.rules.reduce((cwes: string[], rule) => {
      return cwes.concat(rule.cwes)
    }, []);
    return unique(result).sort();
  }
}


function getRules(report: SarifReportData) {
  let sarifRules: SarifRule[] | null = null;

  if (report.version === '2.1.0') {
    if (report.runs) {
      report.runs.forEach(run => {
        if (run.tool.driver.name === 'CodeQL') { //TODO could support other tools
          sarifRules = run.tool.driver.rules;
        }

        if(run.tool.extensions) {
          run.tool.extensions.forEach(ext => {
            if(ext.rules) {
              if(sarifRules) {
                sarifRules = sarifRules.concat(ext.rules);
              }
              else{
                sarifRules = ext.rules;
              }
            }
          });
        }
      });
    }
  } else {
    throw new Error(`Unsupported version: ${report.version}`)
  }

  return getAppliedRuleDetails(sarifRules);
}


function getAppliedRuleDetails(sarifRules: SarifRule[] | null): CodeScanningRule[] | null {
  if (sarifRules) {
    return sarifRules.map(rule => {
      return new CodeScanningRule(rule)
    });
  }

  return null;
}


function unique(array: string[]): string[] {
  return array.filter((val, idx, self) => {
    return self.indexOf(val) === idx
  });
}