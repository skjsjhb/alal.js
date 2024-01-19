import { getTranslation } from '@/modules/i18n/Locale';

let tipMsgList: string[];

/**
 * Gets a random tip message.
 *
 * This method utilizes translation modules. Initialize them first.
 */
export function getTip(): string {
    if (!tipMsgList) {
        tipMsgList = getTranslation('tips').split('\n');
    }
    return tipMsgList[Math.floor(Math.random() * tipMsgList.length)];
}
