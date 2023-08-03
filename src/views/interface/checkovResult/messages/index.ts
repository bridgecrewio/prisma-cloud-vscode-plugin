import { CHECKOV_RESULT_VIEW_MESSAGE_TYPE } from '../../../../constants';
import { CheckovResultViewMessage } from '../../../../types';
import { SuppressMessage } from './suppress';
import { FixMessage } from './fix';

export class MessageHandlersFactory {
    private static readonly handlers = new Map<CHECKOV_RESULT_VIEW_MESSAGE_TYPE, () => void>([
        [CHECKOV_RESULT_VIEW_MESSAGE_TYPE.SUPPRESS, SuppressMessage.handle],
        [CHECKOV_RESULT_VIEW_MESSAGE_TYPE.FIX, FixMessage.handle],
    ]);

    public static handle(message: CheckovResultViewMessage) {
        const handler = MessageHandlersFactory.handlers.get(message.type);

        if (!handler) {
            return;
        }

        return handler();
    }
};
