import * as fs from 'fs';
import glob from 'glob';

interface Options {
  /**
   * Current working directory
   * @defaultValue ./
   */
  cwd: string;
  /**
   * Included patterns
   * @defaultValue ['**\/*.js', '**\/*.styl']
   */
  patterns: string[];
  /**
   * Excluded patterns
   * @defaultValue ['node_modules/**']
   */
  ignores: string[];
  /**
   * The output unused files list path
   * @defaultValue ./unused-files
   */
  output: string;
}

class FastDependenciesAnalyzerPlugin {
  options: Options;
  constructor(options: Options) {
    this.options = options || { cwd: '', patterns: [], ignores: [], output: '' };
    this.options.cwd = options.cwd || './';
    this.options.patterns = options.patterns || ['**/*.js', '**/*.styl'];
    this.options.ignores = (options.ignores || []).concat('node_modules/**');
    this.options.output = options.output || './unused-files';

    this.apply = this.apply.bind(this);
  }

  apply(compiler: any) {
    compiler.plugin('after-compile', (compilation: any, callback: any) => {
      const localDependencies = new Set();
      for (const dependency of compilation.fileDependencies) {
        if (!/node_modules/.test(dependency)) {
          localDependencies.add(dependency);
        }
      }

      Promise.all(this.options.patterns.map((pattern) => {
        return new Promise((resolve, reject) => {
          glob(pattern, { cwd: this.options.cwd, ignore: this.options.ignores, absolute: true }, (err: Error | null, files: string[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(files);
            }
          });
        });
      }))
        .then((matches: any) => {
          const unusedFiles: string[] = [];
          for (let files of matches) {
            for (let file of files) {
              if (!localDependencies.has(file)) {
                unusedFiles.push(file);
              }
            }
          }
          return new Promise((resolve, reject) => {
            fs.writeFile(this.options.output, unusedFiles.join('\n'), (err: Error | null) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        })
        .then(() => {
          callback();
        })
        .catch((err) => {
          callback(err);
        });
    });
  }
}

export default FastDependenciesAnalyzerPlugin;
