import React from 'react';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fab, faPython} from '@fortawesome/free-brands-svg-icons';
import {
  faLaptopCode,
  faDrawPolygon,
  faEdit,
  faBullhorn,
  faMapMarkerAlt,
  faPhone,
  faPaperPlane,
  faLock,
  faBezierCurve,
  faBrain,
  faServer
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/* add any additional icon to the library */
library.add(fab, faPython, faLaptopCode, faDrawPolygon, faEdit, faEdit, faBullhorn, faMapMarkerAlt, faPhone, faPaperPlane, faLock, faBezierCurve, faBrain, faServer
  );

export const Icon = ({ ...props }) => {
  if (props.icon === 'python'){
    return <FontAwesomeIcon icon={['fab', 'python']} />;
  } if (props.icon === 'rproject'){
    return <FontAwesomeIcon icon={['fab', 'r-project']} />;
  } else {
    return <FontAwesomeIcon {...props} />;
  }
}

export default Icon;
