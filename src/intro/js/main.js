// import 'jquery';
// import 'popper.js';
// import 'bootstrap';
import { Button, Dropdown, Modal, Collapse } from 'bootstrap';

import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faCloudShowersHeavy } from '@fortawesome/free-solid-svg-icons/faCloudShowersHeavy';
import { faRssSquare } from '@fortawesome/free-solid-svg-icons/faRssSquare';
// import { faLink, faCloudShowersHeavy } from '@fortawesome/free-solid-svg-icons';
library.add(faCloudShowersHeavy, faRssSquare);
dom.i2svg()

import 'style.scss';
import './index.js';
import './regsw.js';
import './fetch.js';

