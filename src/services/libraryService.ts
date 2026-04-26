import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  getDocs 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface LibraryNode {
  id: string;
  title: string;
  content: string;
  parent_id: string;
  level: number;
  order_index: number;
  slug: string;
  author_id: string;
  created_at: any;
  updated_at: any;
}

export const getNodeStream = (callback: (nodes: LibraryNode[]) => void) => {
  const q = query(collection(db, 'library_nodes'), orderBy('order_index', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const nodes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryNode));
    callback(nodes);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'library_nodes');
  });
};

export const createNode = async (data: Omit<LibraryNode, 'id' | 'author_id' | 'created_at' | 'updated_at'>) => {
  const path = 'library_nodes';
  try {
    const payload = {
      ...data,
      author_id: auth.currentUser?.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    return await addDoc(collection(db, path), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateNode = async (id: string, data: Partial<LibraryNode>) => {
  const nodeRef = doc(db, 'library_nodes', id);
  try {
    return await updateDoc(nodeRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `library_nodes/${id}`);
  }
};

export const deleteNode = async (id: string) => {
  const nodeRef = doc(db, 'library_nodes', id);
  try {
    return await deleteDoc(nodeRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `library_nodes/${id}`);
  }
};
