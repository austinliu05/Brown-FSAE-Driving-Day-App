import os
from django.conf import settings
from .data_containers import ldData
from ..firebase.firestore import upload_csv_to_firestore
from ..firebase.firebase import firebase_app
from firebase_admin import firestore
from django.core.files.storage import default_storage

db = firestore.client()

def process_and_upload_inputted_ld_file(inputted_file, run_month, run_date, run_year, run_title):
    '''
        Process LD file that is inputted by the user
    '''
    data_path = settings.DATA_DIR

    if inputted_file.name.endswith('.ld'):
        file_content = inputted_file.read()

        # Change to account for uploaded metadata
        with default_storage.open(os.path.join(data_path, f'{run_month}-{run_date}-{run_year}-{run_title}.ld'), "wb+") as destination_file:
            destination_file.write(file_content)

        process_and_upload_ld_files()
        # Delete LD file afterwards
    # print(inputted_file.name)

def process_and_upload_ld_files():
    '''
        Process LD (Logical Data) files in the data directory, convert them to CSV format, and upload the CSV files to Firestore.

    This function performs the following steps:
    '''
    data_path = settings.DATA_DIR
    os.makedirs(data_path, exist_ok=True)

    for filename in os.listdir(data_path):
        if not filename.endswith('.ld'):
            continue
        file_path = os.path.join(data_path, filename)
        
        # Parsing LD into CSV
        l = ldData.fromfile(file_path)
        df = l.to_dataframe()

        csv_filename = os.path.join(data_path, os.path.splitext(filename)[0] + '.csv')
        df.to_csv(csv_filename, index=False)
        print(f"Data saved to {csv_filename}")
        
        # Uploading CSV to Firebase
        upload_csv_to_firestore(csv_filename)
        print(f"Data from {csv_filename} uploaded to Firestore")

    # Deleting all files in the folder after processing
    for filename in os.listdir(data_path):
        file_path = os.path.join(data_path, filename)
        if filename.endswith('.ld') or filename.endswith('.csv'):
            try:
                os.remove(file_path)
                print(f"Deleted {file_path}")
            except Exception as e:
                print(f"Failed to delete {file_path}: {e}")

if __name__ == '__main__':
    process_and_upload_ld_files()
