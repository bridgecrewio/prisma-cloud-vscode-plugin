import { EOL } from 'os';
import { readFile } from 'fs/promises';
import { Position } from 'vscode';

// looking for property "//":[]
const COMMENTS_SECTION_REGEXP = /^(\s*|\t*)"\/\/"(\s*|\t*):(\s*|\t*)\[/m;

export class SuppressServicePackageJson{
    private resultPosition?: Position;
    private isCommentsSectionExist: boolean = false;

    constructor(private readonly filePath: string){}

    private async processResultPosition() {
        if(this.resultPosition?.line){
            return;
        }

        const lines = await this.getFileLines();

        for (const [ind, line] of lines.entries()) {
            if (COMMENTS_SECTION_REGEXP.test(line)) {
                this.resultPosition = new Position(ind + 1, 0);
                this.isCommentsSectionExist = true;
                return;
            } else if (line.trim() !== '' && line.trim() !== '}') {
                this.resultPosition = new Position(ind, lines[ind].length);
                this.isCommentsSectionExist = false;
            }
        }
    }

    public async resolveResultPosition(){
        if(!this.resultPosition){
            await this.processResultPosition();
        }
        return this.resultPosition!;
    }

    private async getFileLines(){
        const fileContent = await readFile(this.filePath);
        return fileContent.toString().split(EOL);
    }

    public async wrapWithSuppressionCommentsSection(suppressionComment: string) {
        const prefix = '    ';
        await this.processResultPosition();

        if(this.isCommentsSectionExist){
            return  prefix + `${suppressionComment},` + EOL;
        }

        return ',' + EOL +  '  "//": [' + EOL + prefix + suppressionComment + EOL + '  ]';
    }
}
