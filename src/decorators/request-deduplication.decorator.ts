import { SetMetadata } from '@nestjs/common';
import { SKIP_DEDUPLICATE_REQUEST_KEY } from '../constants';

export const SkipDeduplicateRequest = () => SetMetadata(SKIP_DEDUPLICATE_REQUEST_KEY, true);
